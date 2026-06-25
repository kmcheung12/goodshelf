import * as THREE from 'three';
import {
  ROOM_HALF_W, ROOM_HALF_D, ROOM_HEIGHT,
  COLOR_WALL, COLOR_FLOOR, COLOR_CEILING,
  WALL_THICKNESS,
} from './constants';

function makeMat(color: string, roughness = 0.95, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness });
}

export function buildRoom(scene: THREE.Scene): void {
  const wallMat = makeMat(COLOR_WALL);
  const floorMat = makeMat(COLOR_FLOOR, 0.62, 0.04);
  const ceilMat = makeMat(COLOR_CEILING);

  const W = ROOM_HALF_W * 2;
  const D = ROOM_HALF_D * 2;
  const H = ROOM_HEIGHT;
  const T = WALL_THICKNESS;

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
}
