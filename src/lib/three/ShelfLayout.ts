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

// Row fill order: middle outward → [5,4,6,3,7,2,8,1,9,0] for 10 rows.
// Works for both even and odd totals.
function rowFillOrder(total: number): number[] {
  const order: number[] = [];
  let lo = Math.floor((total - 1) / 2);
  let hi = lo + 1;
  if (total % 2 === 1) { order.push(lo); lo--; }
  while (lo >= 0 || hi < total) {
    if (hi < total) order.push(hi++);
    if (lo >= 0)    order.push(lo--);
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

// Cursor within a wall: which row in the fill-order array we're on,
// and how far along the row's linear axis the last book ended.
interface WallCursor { rowOrderIdx: number; pos: number }

// Fill the back wall starting from a saved cursor position.
// Returns how many books were placed and the updated cursor.
function fillBackWall(
  group: THREE.Group,
  meshMap: Map<string, THREE.Mesh>,
  books: BookData[],
  cursor: WallCursor,
): { placed: number; cursor: WallCursor } {
  const rowOrder = rowFillOrder(SHELF_ROWS);
  const fullHalf = ROOM_HALF_W - WALL_THICKNESS / 2;
  const xMax = fullHalf * debugState.shelfWidthScale;
  const xMin = -xMax;
  const baseZ = -ROOM_HALF_D + CASE_DEPTH / 2;

  let bookIndex = 0;
  let { rowOrderIdx, pos } = cursor;

  for (; rowOrderIdx < rowOrder.length; rowOrderIdx++) {
    if (bookIndex >= books.length) break;
    const r = rowOrder[rowOrderIdx];
    const shelfY = SHELF_Y0 + r * SHELF_DY + SHELF_PLANK_THICKNESS;
    let x = pos;

    while (bookIndex < books.length) {
      const book = books[bookIndex];
      const seed  = stableHash(book.id);
      const t     = bookThickness(book);
      if (x + t > xMax) { pos = xMin; break; }

      const h     = bookHeight(seed);
      const depth = depthVariation(seed);
      placeMesh(group, meshMap, book, seed, t, h, x + t / 2, shelfY + h / 2, baseZ + depth, 0);
      x += t;
      bookIndex++;
    }

    if (bookIndex >= books.length) { pos = x; break; }
  }

  return { placed: bookIndex, cursor: { rowOrderIdx, pos } };
}

// Fill a side wall starting from a saved cursor position.
function fillSideWall(
  group: THREE.Group,
  meshMap: Map<string, THREE.Mesh>,
  books: BookData[],
  side: 'left' | 'right',
  cursor: WallCursor,
): { placed: number; cursor: WallCursor } {
  const rowOrder = rowFillOrder(SHELF_ROWS);
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
  let { rowOrderIdx, pos } = cursor;

  for (; rowOrderIdx < rowOrder.length; rowOrderIdx++) {
    if (bookIndex >= books.length) break;
    const r = rowOrder[rowOrderIdx];
    const shelfY = SHELF_Y0 + r * SHELF_DY + SHELF_PLANK_THICKNESS;
    let z = pos;

    while (bookIndex < books.length) {
      const book = books[bookIndex];
      const seed  = stableHash(book.id);
      const t     = bookThickness(book);
      if (z + t > zMax) { pos = zMin; break; }

      const h     = bookHeight(seed);
      const depth = depthVariation(seed);
      const bx    = sideX + (side === 'left' ? depth : -depth);
      placeMesh(group, meshMap, book, seed, t, h, bx, shelfY + h / 2, z + t / 2, rotY);
      z += t;
      bookIndex++;
    }

    if (bookIndex >= books.length) { pos = z; break; }
  }

  return { placed: bookIndex, cursor: { rowOrderIdx, pos } };
}

export interface PlaceBooksResult {
  group: THREE.Group;
  meshMap: Map<string, THREE.Mesh>;
  placedRead: BookData[];
  placedToRead: BookData[];
  placedCurrent: BookData[];
}

// Wall assignment: back (centre) = read, left = currently-reading, right = to-read.
// Books that overflow their primary wall spill onto other walls with remaining space.
export function placeBooks(
  scene: THREE.Scene,
  readBooks: BookData[],
  toReadBooks: BookData[],
  currentlyReadingBooks: BookData[],
): PlaceBooksResult {
  const group   = new THREE.Group();
  const meshMap = new Map<string, THREE.Mesh>();

  // Compute initial cursor positions for each wall
  const fullHalf = ROOM_HALF_W - WALL_THICKNESS / 2;
  const backXMin = -(fullHalf * debugState.shelfWidthScale);
  const fullZMin = -ROOM_HALF_D + CORNER_GAP + WALL_THICKNESS / 2;
  const fullZMax = ROOM_HALF_D - WALL_THICKNESS / 2;
  const zCenter  = (fullZMin + fullZMax) / 2;
  const sideZMin = zCenter - ((fullZMax - fullZMin) / 2) * debugState.shelfWidthScale;

  // Primary fill: each shelf category on its designated wall
  const leftFill  = fillSideWall(group, meshMap, currentlyReadingBooks, 'left',  { rowOrderIdx: 0, pos: sideZMin });
  const backFill  = fillBackWall(group, meshMap, readBooks,                       { rowOrderIdx: 0, pos: backXMin });
  const rightFill = fillSideWall(group, meshMap, toReadBooks,            'right', { rowOrderIdx: 0, pos: sideZMin });

  // Overflow fill: any books not placed go onto walls with remaining capacity.
  // Overflow order preserves original category order (currently-reading → read → to-read).
  const overflow = [
    ...currentlyReadingBooks.slice(leftFill.placed),
    ...readBooks.slice(backFill.placed),
    ...toReadBooks.slice(rightFill.placed),
  ];

  if (overflow.length > 0) {
    let remaining = overflow;

    const passes: Array<() => number> = [
      () => { const r = fillSideWall(group, meshMap, remaining, 'left',  leftFill.cursor);  leftFill.cursor  = r.cursor; return r.placed; },
      () => { const r = fillBackWall(group, meshMap, remaining,          backFill.cursor);  backFill.cursor  = r.cursor; return r.placed; },
      () => { const r = fillSideWall(group, meshMap, remaining, 'right', rightFill.cursor); rightFill.cursor = r.cursor; return r.placed; },
    ];

    for (const pass of passes) {
      if (remaining.length === 0) break;
      const placed = pass();
      remaining = remaining.slice(placed);
    }
  }

  scene.add(group);

  return {
    group,
    meshMap,
    placedRead:    readBooks.filter(b => meshMap.has(b.id)),
    placedToRead:  toReadBooks.filter(b => meshMap.has(b.id)),
    placedCurrent: currentlyReadingBooks.filter(b => meshMap.has(b.id)),
  };
}
