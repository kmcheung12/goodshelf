import * as THREE from 'three';
import { buildRoom } from './room';
import { buildShelves } from './shelves';
import { buildLighting } from './lighting';
import { Controls } from './controls';
import { placeBooks } from './ShelfLayout';
import type { BookData } from '../adapters/types';
import {
  CAM_START_X, CAM_START_Y, CAM_START_Z, CAM_FOV,
  CAM_NEAR, CAM_FAR, COLOR_SCENE_BG, TONE_MAPPING_EXPOSURE,
  BOOK_HOVER_OFFSET, BOOK_HOVER_LERP, DRAG_THRESHOLD_PX,
} from './constants';

export interface SceneHandle {
  controls: Controls;
  setBooks(books: BookData[]): void;
  dispose(): void;
}

export function initScene(
  canvas: HTMLCanvasElement,
  onBookSelect?: (book: BookData | null) => void
): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLOR_SCENE_BG);

  const camera = new THREE.PerspectiveCamera(CAM_FOV, window.innerWidth / window.innerHeight, CAM_NEAR, CAM_FAR);
  camera.position.set(CAM_START_X, CAM_START_Y, CAM_START_Z);

  buildRoom(scene);
  buildShelves(scene);
  buildLighting(scene);

  const controls = new Controls(camera);
  controls.attach(canvas);

  // Book group — replaced on each setBooks() call
  let bookGroup: THREE.Group | null = null;

  // Raycaster for crosshair hover (screen centre = NDC 0,0)
  const raycaster = new THREE.Raycaster();
  const centre = new THREE.Vector2(0, 0);

  // Click handler: fire on pointerup with no movement (not a drag)
  let pointerDownAt = { x: 0, y: 0 };
  const onPointerDown = (e: PointerEvent) => { pointerDownAt = { x: e.clientX, y: e.clientY }; };
  const onPointerUp = (e: PointerEvent) => {
    if (!controls.isLocked) return;
    const dx = e.clientX - pointerDownAt.x;
    const dy = e.clientY - pointerDownAt.y;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) return; // was a drag, not a click

    if (!bookGroup) { onBookSelect?.(null); return; }
    raycaster.setFromCamera(centre, camera);
    const hits = raycaster.intersectObjects(bookGroup.children, true);
    if (hits.length > 0) {
      const mesh = hits[0].object as THREE.Mesh;
      onBookSelect?.(mesh.userData.bookData ?? null);
    } else {
      onBookSelect?.(null);
    }
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  const _hoverForward = new THREE.Vector3();
  const _hoverTarget = new THREE.Vector3();

  let raf = 0;
  const animate = () => {
    raf = requestAnimationFrame(animate);
    controls.update();

    // Hover animation: lerp books toward/away from BOOK_HOVER_OFFSET
    if (bookGroup && controls.isLocked) {
      raycaster.setFromCamera(centre, camera);
      const hits = raycaster.intersectObjects(bookGroup.children, true);
      const hoveredMesh: THREE.Mesh | null = hits.length > 0
        ? hits[0].object as THREE.Mesh
        : null;

      for (const child of bookGroup.children) {
        const mesh = child as THREE.Mesh;
        const base = mesh.userData.basePos as THREE.Vector3;
        const rotY = mesh.userData.baseRotY as number;
        const isHovered = child === hoveredMesh;

        _hoverForward.set(-Math.sin(rotY), 0, Math.cos(rotY));
        if (isHovered) {
          _hoverTarget.copy(base).addScaledVector(_hoverForward, BOOK_HOVER_OFFSET);
          mesh.position.lerp(_hoverTarget, BOOK_HOVER_LERP);
        } else {
          mesh.position.lerp(base, BOOK_HOVER_LERP);
        }
      }
    }

    renderer.render(scene, camera);
  };
  animate();

  return {
    controls,
    setBooks(books: BookData[]) {
      if (bookGroup) {
        scene.remove(bookGroup);
        bookGroup.traverse((obj) => {
          if (obj instanceof THREE.Mesh) {
            obj.geometry.dispose();
            const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
            mats.forEach((m) => m.dispose());
          }
        });
      }
      bookGroup = placeBooks(scene, books);
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      controls.detach();
      renderer.dispose();
    },
  };
}
