import * as THREE from 'three';
import {
  HEMI_SKY, HEMI_GROUND, HEMI_INTENSITY,
  AMBIENT_INTENSITY,
  KEY_COLOR, KEY_INTENSITY,
  KEY_LIGHT_X, KEY_LIGHT_Y, KEY_LIGHT_Z,
  KEY_SHADOW_NEAR, KEY_SHADOW_FAR,
  KEY_SHADOW_LEFT, KEY_SHADOW_RIGHT, KEY_SHADOW_TOP, KEY_SHADOW_BOTTOM,
  LAMP_CEILING_OFFSET, LAMP_X_FACTOR,
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
  key.position.set(KEY_LIGHT_X, KEY_LIGHT_Y, KEY_LIGHT_Z);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = KEY_SHADOW_NEAR;
  key.shadow.camera.far = KEY_SHADOW_FAR;
  key.shadow.camera.left = KEY_SHADOW_LEFT;
  key.shadow.camera.right = KEY_SHADOW_RIGHT;
  key.shadow.camera.top = KEY_SHADOW_TOP;
  key.shadow.camera.bottom = KEY_SHADOW_BOTTOM;
  scene.add(key);

  // Ceiling point lights (2 lamps)
  const lampY = ROOM_HEIGHT - LAMP_CEILING_OFFSET;
  const lampPositions = [
    [-ROOM_HALF_W * LAMP_X_FACTOR, lampY, 0],
    [ROOM_HALF_W * LAMP_X_FACTOR, lampY, 0],
  ] as const;
  for (const [x, y, z] of lampPositions) {
    const pt = new THREE.PointLight(POINT_COLOR, POINT_INTENSITY, 0, POINT_DECAY);
    pt.position.set(x, y, z);
    // castShadow omitted: each point light needs a 6-face cubemap shadow pass per frame,
    // multiplying draw calls by 6×. The directional key light handles all shadow detail.
    scene.add(pt);
  }
}
