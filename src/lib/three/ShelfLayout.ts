import * as THREE from 'three';
import type { BookData } from '../adapters/types';
import { createBookMesh } from './BookMesh';
import {
  ROOM_HALF_W, ROOM_HALF_D,
  SHELF_ROWS, SHELF_Y0, SHELF_DY, SHELF_PLANK_THICKNESS,
  CASE_HEIGHT, CASE_DEPTH, SPINE_THICKNESS,
  WALL_THICKNESS, CORNER_GAP,
  BOOK_DEPTH_VARIATION,
} from './constants';
import { debugState } from './debug';

// Row fill order: middle outward → e.g. [4,5,3,6,2,7,1,8,0,9] for 10 rows
function rowFillOrder(total: number): number[] {
  const mid = Math.floor(total / 2);
  const order: number[] = [];
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? mid - Math.floor(i / 2) : mid + Math.ceil(i / 2);
    if (r >= 0 && r < total) order.push(r);
  }
  return order;
}

// Stable integer hash from book ID so appearance never changes on rebuild.
function stableHash(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) {
    h = (Math.imul(31, h) + id.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

// Thickness in metres based on page count. 280 pages ≈ SPINE_THICKNESS (default).
function bookThickness(book: BookData): number {
  const pages = book.numPages ?? 0;
  if (pages <= 0) return SPINE_THICKNESS;
  return Math.max(0.012, Math.min(0.055, (pages / 280) * SPINE_THICKNESS));
}

// Deterministic height derived from book ID hash, scaled by debugState.
function bookHeight(seed: number): number {
  const t = Math.abs(Math.sin(seed * 2.3 + 7.1)) * 0.5 + Math.abs(Math.cos(seed * 1.7 + 3.4)) * 0.5;
  return CASE_HEIGHT * 0.82 + CASE_HEIGHT * 0.18 * t * debugState.heightScale;
}

// Deterministic depth push derived from book ID hash, scaled by debugState.
function depthVariation(seed: number): number {
  return Math.sin(seed * 2.7 + 1.3) * BOOK_DEPTH_VARIATION * debugState.depthScale;
}

// All per-book values pre-computed by the caller — no redundant recalculation.
function placeMesh(
  group: THREE.Group,
  meshMap: Map<string, THREE.Mesh>,
  book: BookData,
  seed: number,
  t: number,   // thickness
  h: number,   // height
  x: number, y: number, z: number,
  rotY: number,
): void {
  const mesh = createBookMesh(book, seed);
  mesh.scale.set(t / SPINE_THICKNESS, h / CASE_HEIGHT, 1);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  mesh.userData.basePos  = mesh.position.clone();
  mesh.userData.baseRotY = rotY;
  mesh.userData.baseQuat = mesh.quaternion.clone();
  // Precompute hover-forward components — rotY is constant, no reason to call
  // Math.sin/cos 1200 times per animation frame.
  mesh.userData.hfx = Math.sin(rotY);
  mesh.userData.hfz = Math.cos(rotY);
  // Books start at their base position, so they're settled immediately.
  mesh.userData.settled = true;
  group.add(mesh);
  meshMap.set(book.id, mesh);
}

function addBackWallBooks(
  group: THREE.Group,
  meshMap: Map<string, THREE.Mesh>,
  books: BookData[],
): void {
  const baseZ = -ROOM_HALF_D + CASE_DEPTH / 2;
  const fullHalf = ROOM_HALF_W - WALL_THICKNESS / 2;
  const usableHalf = fullHalf * debugState.shelfWidthScale;
  const xMin = -usableHalf;
  const xMax = usableHalf;
  let bookIndex = 0;

  for (const r of rowFillOrder(SHELF_ROWS)) {
    if (bookIndex >= books.length) break;
    const shelfY = SHELF_Y0 + r * SHELF_DY + SHELF_PLANK_THICKNESS;
    let x = xMin;

    while (bookIndex < books.length) {
      const book = books[bookIndex];
      const seed  = stableHash(book.id);
      const t     = bookThickness(book);
      if (x + t > xMax) break;

      const h     = bookHeight(seed);
      const depth = depthVariation(seed);
      placeMesh(group, meshMap, book, seed, t, h, x + t / 2, shelfY + h / 2, baseZ + depth, 0);
      x += t;
      bookIndex++;
    }
  }
}

function addSideWallBooks(
  group: THREE.Group,
  meshMap: Map<string, THREE.Mesh>,
  books: BookData[],
  side: 'left' | 'right',
): void {
  const sideX = side === 'left'
    ? -ROOM_HALF_W + CASE_DEPTH / 2
    : ROOM_HALF_W - CASE_DEPTH / 2;
  const rotY = side === 'left' ? Math.PI / 2 : -Math.PI / 2;

  const fullZMin = -ROOM_HALF_D + CORNER_GAP + WALL_THICKNESS / 2;
  const fullZMax = ROOM_HALF_D - WALL_THICKNESS / 2;
  const zCenter  = (fullZMin + fullZMax) / 2;
  const halfDepth = ((fullZMax - fullZMin) / 2) * debugState.shelfWidthScale;
  const zMin = zCenter - halfDepth;
  const zMax = zCenter + halfDepth;
  let bookIndex = 0;

  for (const r of rowFillOrder(SHELF_ROWS)) {
    if (bookIndex >= books.length) break;
    const shelfY = SHELF_Y0 + r * SHELF_DY + SHELF_PLANK_THICKNESS;
    let z = zMin;

    while (bookIndex < books.length) {
      const book = books[bookIndex];
      const seed  = stableHash(book.id);
      const t     = bookThickness(book);
      if (z + t > zMax) break;

      const h     = bookHeight(seed);
      const depth = depthVariation(seed);
      const bx    = sideX + (side === 'left' ? depth : -depth);
      placeMesh(group, meshMap, book, seed, t, h, bx, shelfY + h / 2, z + t / 2, rotY);
      z += t;
      bookIndex++;
    }
  }
}

// Wall assignment: back (centre) = read, left = currently-reading, right = to-read
export function placeBooks(
  scene: THREE.Scene,
  readBooks: BookData[],
  toReadBooks: BookData[],
  currentlyReadingBooks: BookData[],
): { group: THREE.Group; meshMap: Map<string, THREE.Mesh> } {
  const group   = new THREE.Group();
  const meshMap = new Map<string, THREE.Mesh>();

  addSideWallBooks(group, meshMap, currentlyReadingBooks, 'left');
  addBackWallBooks(group, meshMap, readBooks);
  addSideWallBooks(group, meshMap, toReadBooks, 'right');

  scene.add(group);
  return { group, meshMap };
}
