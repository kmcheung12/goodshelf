import * as THREE from 'three';
import type { BookData } from '../adapters/types';
import { createBookMesh } from './BookMesh';
import {
  ROOM_HALF_W, ROOM_HALF_D,
  SHELF_ROWS, SHELF_Y0, SHELF_DY, SHELF_PLANK_THICKNESS,
  CASE_HEIGHT, CASE_DEPTH, SPINE_THICKNESS,
  WALL_THICKNESS, CORNER_GAP,
  SHELF_BACK_BOOKS_PER_ROW, SHELF_SIDE_BOOKS_PER_ROW,
} from './constants';

type Slot = { x: number; y: number; z: number; rotY: number };

// Row fill order: middle outward → [4,5,3,6,2,7,1,8,0,9] for 10 rows
function rowFillOrder(total: number): number[] {
  const mid = Math.floor(total / 2);
  const order: number[] = [];
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? mid - Math.floor(i / 2) : mid + Math.ceil(i / 2);
    if (r >= 0 && r < total) order.push(r);
  }
  return order;
}

function buildSlots(): Slot[] {
  const slots: Slot[] = [];

  for (const r of rowFillOrder(SHELF_ROWS)) {
    const y = SHELF_Y0 + r * SHELF_DY + SHELF_PLANK_THICKNESS + CASE_HEIGHT / 2;
    const baseZ = -ROOM_HALF_D + CASE_DEPTH / 2;
    const sideX_L = -ROOM_HALF_W + CASE_DEPTH / 2;
    const sideX_R = ROOM_HALF_W - CASE_DEPTH / 2;
    const sideZ0 = -ROOM_HALF_D + CORNER_GAP + WALL_THICKNESS / 2 + SPINE_THICKNESS / 2;

    // Back wall
    const backX0 = -ROOM_HALF_W + WALL_THICKNESS / 2 + SPINE_THICKNESS / 2;
    for (let i = 0; i < SHELF_BACK_BOOKS_PER_ROW; i++) {
      slots.push({ x: backX0 + i * SPINE_THICKNESS, y, z: baseZ, rotY: 0 });
    }

    // Left wall
    for (let i = 0; i < SHELF_SIDE_BOOKS_PER_ROW; i++) {
      slots.push({ x: sideX_L, y, z: sideZ0 + i * SPINE_THICKNESS, rotY: -Math.PI / 2 });
    }

    // Right wall
    for (let i = 0; i < SHELF_SIDE_BOOKS_PER_ROW; i++) {
      slots.push({ x: sideX_R, y, z: sideZ0 + i * SPINE_THICKNESS, rotY: Math.PI / 2 });
    }
  }

  return slots;
}

export function placeBooks(scene: THREE.Scene, books: BookData[]): THREE.Group {
  const group = new THREE.Group();
  const slots = buildSlots();
  const count = Math.min(books.length, slots.length);

  for (let i = 0; i < count; i++) {
    const slot = slots[i];
    const mesh = createBookMesh(books[i], i);
    mesh.position.set(slot.x, slot.y, slot.z);
    mesh.rotation.y = slot.rotY;
    mesh.userData.basePos = new THREE.Vector3(slot.x, slot.y, slot.z);
    mesh.userData.baseRotY = slot.rotY;
    group.add(mesh);
  }

  scene.add(group);
  return group;
}
