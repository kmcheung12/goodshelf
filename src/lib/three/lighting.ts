import * as THREE from 'three';
import {
  HEMI_SKY, HEMI_GROUND, HEMI_INTENSITY,
  AMBIENT_INTENSITY,
  KEY_COLOR, KEY_INTENSITY,
  POINT_COLOR, POINT_INTENSITY, POINT_DECAY,
  ROOM_HALF_W, ROOM_HEIGHT,
} from './constants';

export function buildLighting(scene: THREE.Scene): void {
  // Hemisphere
  const hemi = new THREE.HemisphereLight(HEMI_SKY, HEMI_GROUND, HEMI_INTENSITY);
  scene.add(hemi);

  // Ambient
  const ambient = new THREE.AmbientLight('#ffffff', AMBIENT_INTENSITY);
  scene.add(ambient);

  // Key directional
  const key = new THREE.DirectionalLight(KEY_COLOR, KEY_INTENSITY);
  key.position.set(0.7, 3.6, 0.9);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.1;
  key.shadow.camera.far = 10;
  key.shadow.camera.left = -2;
  key.shadow.camera.right = 2;
  key.shadow.camera.top = 3;
  key.shadow.camera.bottom = -1;
  scene.add(key);

  // Ceiling point lights (2 lamps)
  const lampY = ROOM_HEIGHT - 0.05;
  const lampPositions = [
    [-ROOM_HALF_W * 0.4, lampY, 0],
    [ROOM_HALF_W * 0.4, lampY, 0],
  ] as const;
  for (const [x, y, z] of lampPositions) {
    const pt = new THREE.PointLight(POINT_COLOR, POINT_INTENSITY, 0, POINT_DECAY);
    pt.position.set(x, y, z);
    pt.castShadow = true;
    pt.shadow.mapSize.set(512, 512);
    scene.add(pt);
  }
}
