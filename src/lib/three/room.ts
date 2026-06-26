import * as THREE from 'three';
import {
  ROOM_HALF_W, ROOM_HALF_D, ROOM_HEIGHT,
  COLOR_WALL, COLOR_FLOOR, COLOR_CEILING,
  WALL_THICKNESS,
  DOOR_W, DOOR_H, DOOR_FRAME_T, CORRIDOR_D,
  COLOR_DOORFRAME, COLOR_CORRIDOR,
} from './constants';

function makeMat(color: string, roughness = 0.95, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export function buildRoom(scene: THREE.Scene): void {
  const wallMat  = makeMat(COLOR_WALL);
  const floorMat = makeMat(COLOR_FLOOR, 0.62, 0.04);
  const ceilMat  = makeMat(COLOR_CEILING);
  const frameMat = makeMat(COLOR_DOORFRAME, 0.9);
  const corrMat  = makeMat(COLOR_CORRIDOR, 0.98);

  const W  = ROOM_HALF_W * 2;
  const D  = ROOM_HALF_D * 2;
  const H  = ROOM_HEIGHT;
  const T  = WALL_THICKNESS;
  const FZ = ROOM_HALF_D; // front wall Z

  // Back wall (−Z face)
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(W, H, T), wallMat);
  backWall.position.set(0, H / 2, -ROOM_HALF_D);
  backWall.receiveShadow = true;
  scene.add(backWall);

  // Left wall (−X face)
  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(T, H, D), wallMat);
  leftWall.position.set(-ROOM_HALF_W, H / 2, 0);
  leftWall.receiveShadow = true;
  scene.add(leftWall);

  // Right wall (+X face)
  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(T, H, D), wallMat);
  rightWall.position.set(ROOM_HALF_W, H / 2, 0);
  rightWall.receiveShadow = true;
  scene.add(rightWall);

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), floorMat);
  floor.position.set(0, -T / 2, 0);
  floor.receiveShadow = true;
  scene.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(W, T, D), ceilMat);
  ceiling.position.set(0, H + T / 2, 0);
  ceiling.receiveShadow = true;
  scene.add(ceiling);

  // ── Fourth wall with doorway ────────────────────────────────────────────────
  // Split into three panels around the opening:
  //   left panel  | [opening] | right panel
  //                 [lintel ]
  const sideW   = (W - DOOR_W) / 2;
  const lintelH = H - DOOR_H;
  const sideX   = ROOM_HALF_W - sideW / 2;

  // Left panel
  const fwLeft = new THREE.Mesh(new THREE.BoxGeometry(sideW, H, T), wallMat);
  fwLeft.position.set(-sideX, H / 2, FZ);
  fwLeft.receiveShadow = true;
  scene.add(fwLeft);

  // Right panel
  const fwRight = new THREE.Mesh(new THREE.BoxGeometry(sideW, H, T), wallMat);
  fwRight.position.set(sideX, H / 2, FZ);
  fwRight.receiveShadow = true;
  scene.add(fwRight);

  // Lintel (above doorway)
  const fwLintel = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, lintelH, T), wallMat);
  fwLintel.position.set(0, DOOR_H + lintelH / 2, FZ);
  fwLintel.receiveShadow = true;
  scene.add(fwLintel);

  // ── Door frame trim ─────────────────────────────────────────────────────────
  const FT = DOOR_FRAME_T;

  // Left jamb
  const jambL = new THREE.Mesh(new THREE.BoxGeometry(FT, DOOR_H, T * 1.5), frameMat);
  jambL.position.set(-(DOOR_W / 2) + FT / 2, DOOR_H / 2, FZ);
  scene.add(jambL);

  // Right jamb
  const jambR = new THREE.Mesh(new THREE.BoxGeometry(FT, DOOR_H, T * 1.5), frameMat);
  jambR.position.set((DOOR_W / 2) - FT / 2, DOOR_H / 2, FZ);
  scene.add(jambR);

  // Lintel trim (horizontal)
  const lintelTrim = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, FT, T * 1.5), frameMat);
  lintelTrim.position.set(0, DOOR_H - FT / 2, FZ);
  scene.add(lintelTrim);

  // ── Corridor stub beyond the doorway ────────────────────────────────────────
  // Floor strip continuing through
  const corrFloorW = DOOR_W - FT * 2;
  const corrFloor = new THREE.Mesh(new THREE.BoxGeometry(corrFloorW, T, CORRIDOR_D), floorMat);
  corrFloor.position.set(0, -T / 2, FZ + CORRIDOR_D / 2);
  scene.add(corrFloor);

  // Left corridor wall
  const corrLeft = new THREE.Mesh(new THREE.BoxGeometry(T, DOOR_H, CORRIDOR_D), corrMat);
  corrLeft.position.set(-(DOOR_W / 2), DOOR_H / 2, FZ + CORRIDOR_D / 2);
  scene.add(corrLeft);

  // Right corridor wall
  const corrRight = new THREE.Mesh(new THREE.BoxGeometry(T, DOOR_H, CORRIDOR_D), corrMat);
  corrRight.position.set(DOOR_W / 2, DOOR_H / 2, FZ + CORRIDOR_D / 2);
  scene.add(corrRight);

  // Back wall of corridor
  const corrBack = new THREE.Mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, T), corrMat);
  corrBack.position.set(0, DOOR_H / 2, FZ + CORRIDOR_D);
  scene.add(corrBack);

  // Ceiling of corridor
  const corrCeil = new THREE.Mesh(new THREE.BoxGeometry(corrFloorW, T, CORRIDOR_D), ceilMat);
  corrCeil.position.set(0, DOOR_H, FZ + CORRIDOR_D / 2);
  scene.add(corrCeil);
}
