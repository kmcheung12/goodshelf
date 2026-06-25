import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  ROOM_HALF_W, ROOM_HALF_D, ROOM_HEIGHT,
  SHELF_ROWS, SHELF_Y0, SHELF_DY,
  CASE_DEPTH, SHELF_PLANK_THICKNESS,
  CORNER_GAP, COLOR_WOOD, WALL_THICKNESS,
} from './constants';

// Suppress unused-import warning — ROOM_HEIGHT is imported for consistency but not used here
void ROOM_HEIGHT;

export function buildShelves(scene: THREE.Scene): void {
  const mat = new THREE.MeshStandardMaterial({ color: COLOR_WOOD, roughness: 0.9, metalness: 0 });

  const W = ROOM_HALF_W * 2;
  const T = SHELF_PLANK_THICKNESS;
  const sideLen = ROOM_HALF_D * 2 - CORNER_GAP;

  const backGeos: THREE.BufferGeometry[] = [];
  const leftGeos: THREE.BufferGeometry[] = [];
  const rightGeos: THREE.BufferGeometry[] = [];

  for (let r = 0; r < SHELF_ROWS; r++) {
    const y = SHELF_Y0 + r * SHELF_DY + T / 2;

    // Back wall plank
    const bg = new THREE.BoxGeometry(W, T, CASE_DEPTH);
    bg.translate(0, y, -ROOM_HALF_D + CASE_DEPTH / 2);
    backGeos.push(bg);

    // Left wall plank
    const lg = new THREE.BoxGeometry(CASE_DEPTH, T, sideLen);
    lg.translate(-ROOM_HALF_W + CASE_DEPTH / 2, y, -ROOM_HALF_D + CORNER_GAP + sideLen / 2);
    leftGeos.push(lg);

    // Right wall plank
    const rg = new THREE.BoxGeometry(CASE_DEPTH, T, sideLen);
    rg.translate(ROOM_HALF_W - CASE_DEPTH / 2, y, -ROOM_HALF_D + CORNER_GAP + sideLen / 2);
    rightGeos.push(rg);
  }

  // Merge each wall's planks into one mesh — 30 draw calls → 3
  for (const geos of [backGeos, leftGeos, rightGeos]) {
    const merged = mergeGeometries(geos);
    geos.forEach((g) => g.dispose()); // free the individual geometries
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
}
