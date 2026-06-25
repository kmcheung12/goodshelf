import * as THREE from 'three';
import { buildRoom } from './room';
import { buildShelves } from './shelves';
import { buildLighting } from './lighting';
import { Controls } from './controls';
import {
  CAM_START_X, CAM_START_Y, CAM_START_Z, CAM_FOV,
} from './constants';

export interface SceneHandle {
  controls: Controls;
  dispose(): void;
}

export function initScene(canvas: HTMLCanvasElement): SceneHandle {
  // Renderer
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  // Scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#0b0b0d');

  // Camera
  const camera = new THREE.PerspectiveCamera(
    CAM_FOV,
    canvas.clientWidth / canvas.clientHeight,
    0.01,
    20
  );
  camera.position.set(CAM_START_X, CAM_START_Y, CAM_START_Z);

  // Build scene
  buildRoom(scene);
  buildShelves(scene);
  buildLighting(scene);

  // Controls
  const controls = new Controls(camera);
  controls.attach(canvas);

  // Resize handler
  const onResize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  window.addEventListener('resize', onResize);

  // Render loop
  let raf = 0;
  const animate = () => {
    raf = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  return {
    controls,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      controls.detach();
      renderer.dispose();
    },
  };
}
