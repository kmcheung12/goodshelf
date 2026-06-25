import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  ROOM_HALF_W, ROOM_HALF_D,
  SHELF_ROWS, SHELF_Y0, SHELF_DY,
  CASE_DEPTH, SHELF_PLANK_THICKNESS,
  CORNER_GAP, COLOR_WOOD, WALL_THICKNESS,
} from './constants';
import { debugState } from './debug';

export function buildShelves(scene: THREE.Scene): THREE.Group {
  const mat = new THREE.MeshStandardMaterial({ color: COLOR_WOOD, roughness: 0.9, metalness: 0 });
  const T = SHELF_PLANK_THICKNESS;
  const s = debugState.shelfWidthScale;

  // Back wall — width matches the centred book area
  const backHalf = (ROOM_HALF_W - WALL_THICKNESS / 2) * s;
  const backW = backHalf * 2;

  // Side walls — length matches the centred book area
  const fullZMin = -ROOM_HALF_D + CORNER_GAP + WALL_THICKNESS / 2;
  const fullZMax = ROOM_HALF_D - WALL_THICKNESS / 2;
  const zCenter = (fullZMin + fullZMax) / 2;
  const sideHalf = ((fullZMax - fullZMin) / 2) * s;
  const sideLen = sideHalf * 2;

  const backGeos: THREE.BufferGeometry[] = [];
  const leftGeos: THREE.BufferGeometry[] = [];
  const rightGeos: THREE.BufferGeometry[] = [];

  for (let r = 0; r < SHELF_ROWS; r++) {
    const y = SHELF_Y0 + r * SHELF_DY + T / 2;

    // Back wall plank — centred at x=0
    const bg = new THREE.BoxGeometry(backW, T, CASE_DEPTH);
    bg.translate(0, y, -ROOM_HALF_D + CASE_DEPTH / 2);
    backGeos.push(bg);

    // Left wall plank — centred at zCenter
    const lg = new THREE.BoxGeometry(CASE_DEPTH, T, sideLen);
    lg.translate(-ROOM_HALF_W + CASE_DEPTH / 2, y, zCenter);
    leftGeos.push(lg);

    // Right wall plank — centred at zCenter
    const rg = new THREE.BoxGeometry(CASE_DEPTH, T, sideLen);
    rg.translate(ROOM_HALF_W - CASE_DEPTH / 2, y, zCenter);
    rightGeos.push(rg);
  }

  const group = new THREE.Group();

  for (const geos of [backGeos, leftGeos, rightGeos]) {
    const merged = mergeGeometries(geos);
    geos.forEach((g) => g.dispose());
    const mesh = new THREE.Mesh(merged, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
  }

  scene.add(group);
  return group;
}
