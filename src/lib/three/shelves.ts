import * as THREE from 'three';
import {
  ROOM_HALF_W, ROOM_HALF_D, ROOM_HEIGHT,
  SHELF_ROWS, SHELF_Y0, SHELF_DY,
  CASE_DEPTH, SHELF_PLANK_THICKNESS,
  CORNER_GAP, COLOR_WOOD,
} from './constants';

export function buildShelves(scene: THREE.Scene): void {
  const mat = new THREE.MeshStandardMaterial({
    color: COLOR_WOOD,
    roughness: 0.9,
    metalness: 0,
  });

  const W = ROOM_HALF_W * 2;
  const T = SHELF_PLANK_THICKNESS;

  const sideLen = ROOM_HALF_D * 2 - CORNER_GAP;

  for (let r = 0; r < SHELF_ROWS; r++) {
    // Y = bottom surface of plank; books sit on top
    const y = SHELF_Y0 + r * SHELF_DY + T / 2;

    // Back wall shelf — full width
    const backPlank = new THREE.Mesh(
      new THREE.BoxGeometry(W, T, CASE_DEPTH),
      mat
    );
    backPlank.position.set(0, y, -ROOM_HALF_D + CASE_DEPTH / 2);
    backPlank.castShadow = true;
    backPlank.receiveShadow = true;
    scene.add(backPlank);

    // Left wall shelf — runs from entrance to CORNER_GAP before back wall
    const leftPlank = new THREE.Mesh(
      new THREE.BoxGeometry(CASE_DEPTH, T, sideLen),
      mat
    );
    leftPlank.position.set(
      -ROOM_HALF_W + CASE_DEPTH / 2,
      y,
      -ROOM_HALF_D + CORNER_GAP + sideLen / 2
    );
    leftPlank.castShadow = true;
    leftPlank.receiveShadow = true;
    scene.add(leftPlank);

    // Right wall shelf
    const rightPlank = new THREE.Mesh(
      new THREE.BoxGeometry(CASE_DEPTH, T, sideLen),
      mat
    );
    rightPlank.position.set(
      ROOM_HALF_W - CASE_DEPTH / 2,
      y,
      -ROOM_HALF_D + CORNER_GAP + sideLen / 2
    );
    rightPlank.castShadow = true;
    rightPlank.receiveShadow = true;
    scene.add(rightPlank);
  }
}
