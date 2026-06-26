import * as THREE from 'three';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { buildRoom } from './room';
import { buildShelves } from './shelves';
import { buildLighting } from './lighting';
import { Controls } from './controls';
import { placeBooks } from './ShelfLayout';
import { buildDebugGUI } from './debug';
import type { BookData } from '../adapters/types';
import {
  CAM_START_X, CAM_START_Y, CAM_START_Z, CAM_FOV,
  CAM_NEAR, CAM_FAR, COLOR_SCENE_BG, TONE_MAPPING_EXPOSURE,
  BOOK_HOVER_OFFSET, BOOK_HOVER_LERP, DRAG_THRESHOLD_PX,
  BOOK_PEEK_OFFSET, BOOK_PEEK_TILT,
  ROOM_HALF_D, CORRIDOR_D,
  INSPECT_DISTANCE, INSPECT_TILT_X, INSPECT_TILT_Y,
  INSPECT_POS_LERP, INSPECT_ROT_LERP,
} from './constants';
import { debugState } from './debug';

export interface SceneHandle {
  controls: Controls;
  wallPanelElement: HTMLElement;
  loadingElement: HTMLElement;
  overlayElement: HTMLElement;
  setBooks(readBooks: BookData[], toReadBooks: BookData[], currentlyReadingBooks: BookData[]): void;
  lookAtBook(bookId: string): void;
  peekBook(bookId: string | null): void;
  inspectBook(bookId: string): void;
  turnToBooks(): void;
  faceDoorway(): void;
  setLoading(v: boolean): void;
  dispose(): void;
}

export type BookHoverCallback = (book: BookData | null) => void;

export function initScene(
  canvas: HTMLCanvasElement,
  onBookSelect?: (book: BookData | null) => void,
  onInspectChange?: (inspecting: boolean) => void,
  onBookHover?: BookHoverCallback,
): SceneHandle {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const css2d = new CSS2DRenderer();
  css2d.setSize(window.innerWidth, window.innerHeight);
  css2d.domElement.style.cssText =
    'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:100;';

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLOR_SCENE_BG);

  const camera = new THREE.PerspectiveCamera(
    CAM_FOV, window.innerWidth / window.innerHeight, CAM_NEAR, CAM_FAR,
  );
  camera.position.set(CAM_START_X, CAM_START_Y, CAM_START_Z);

  buildRoom(scene);
  let shelfGroup = buildShelves(scene);
  const keyLight = buildLighting(scene);

  // Collect all scene lights now (before the inspect fill light is added) so we
  // can dim them during loading without touching the fill light's own logic.
  const dimLights: { light: THREE.Light; base: number }[] = [];
  scene.traverse((o) => {
    if (o instanceof THREE.Light) dimLights.push({ light: o, base: o.intensity });
  });
  let _lightScale       = 1;
  let _targetLightScale = 1;

  const wallPanelEl = document.createElement('div');
  wallPanelEl.style.pointerEvents = 'auto';
  const wallPanelObj = new CSS2DObject(wallPanelEl);
  wallPanelObj.position.set(0, CAM_START_Y, ROOM_HALF_D);
  scene.add(wallPanelObj);

  const loadingEl = document.createElement('div');
  const loadingObj = new CSS2DObject(loadingEl);
  loadingObj.position.set(0, CAM_START_Y, ROOM_HALF_D);
  loadingObj.visible = false; // CSS2DRenderer respects Object3D.visible
  scene.add(loadingObj);

  const controls = new Controls(camera, Math.PI); // start facing the doorway (+Z)
  controls.attach(canvas);

  let bookGroup:  THREE.Group | null = null;
  let bookMeshMap = new Map<string, THREE.Mesh>();
  let lastBooks: { read: BookData[]; toRead: BookData[]; current: BookData[] } = {
    read: [], toRead: [], current: [],
  };

  function rebuildShelves() {
    scene.remove(shelfGroup);
    shelfGroup.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (!Array.isArray(obj.material)) obj.material.dispose();
      }
    });
    shelfGroup = buildShelves(scene);
  }

  function rebuildBooks() {
    setPeek(null);
    if (inspectedMesh) exitInspect();
    if (bookGroup) {
      scene.remove(bookGroup);
      bookGroup.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => m.dispose());
        }
      });
    }
    const result = placeBooks(scene, lastBooks.read, lastBooks.toRead, lastBooks.current);
    bookGroup   = result.group;
    bookMeshMap = result.meshMap;
  }

  function rebuildAll() {
    rebuildShelves();
    rebuildBooks();
  }

  const gui = buildDebugGUI(keyLight, rebuildBooks, rebuildAll);

  // ── Inspect fill light — follows camera, on only during inspect ────────────
  // The book cover faces the camera when inspected, but the scene key light
  // comes from above-behind, leaving the cover poorly lit. This fill light
  // sits just behind the camera and illuminates the facing side directly.
  const inspectFillLight = new THREE.PointLight('#fff8f0', 0, 0, 2);
  scene.add(inspectFillLight);

  // ── Inspect state ──────────────────────────────────────────────────────────
  let inspectedMesh: THREE.Mesh | null = null;
  const inspectHoldPos = new THREE.Vector3();
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;

  const _inspectDir      = new THREE.Vector3();
  const _inspectQuat     = new THREE.Quaternion();
  const _inspectBaseQuat = new THREE.Quaternion();
  const _inspectTiltQuat = new THREE.Quaternion();
  const _inspectTiltEul  = new THREE.Euler(0, 0, 0, 'YXZ');
  const _inspectMatrix   = new THREE.Matrix4();
  const _inspectBookX    = new THREE.Vector3();
  const _inspectBookY    = new THREE.Vector3();
  const _inspectBookZ    = new THREE.Vector3();
  const _worldUp         = new THREE.Vector3(0, 1, 0);

  function enterInspect(mesh: THREE.Mesh) {
    // Return any previously inspected book to the shelf
    if (inspectedMesh && inspectedMesh !== mesh) {
      inspectedMesh.userData.inspecting = false;
    }
    setPeek(null);
    inspectedMesh = mesh;
    mesh.userData.inspecting = true;
    mesh.userData.loadCover?.(); // ensure cover loads when inspected

    mouseX = window.innerWidth / 2;
    mouseY = window.innerHeight / 2;

    document.exitPointerLock();
    onBookSelect?.(mesh.userData.bookData ?? null);
    onInspectChange?.(true);
  }

  function exitInspect() {
    if (!inspectedMesh) return;
    inspectedMesh.userData.inspecting = false;
    inspectedMesh = null;
    inspectFillLight.intensity = 0;
    onBookSelect?.(null);
    onInspectChange?.(false);
    _lastHovered = null;
    onBookHover?.(null);
    canvas.requestPointerLock();
  }

  // ── Input handlers ─────────────────────────────────────────────────────────
  const onMouseMove = (e: MouseEvent) => {
    if (inspectedMesh) { mouseX = e.clientX; mouseY = e.clientY; }
  };
  document.addEventListener('mousemove', onMouseMove);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && inspectedMesh) exitInspect();
  };
  document.addEventListener('keydown', onKeyDown);

  const raycaster = new THREE.Raycaster();
  const centre = new THREE.Vector2(0, 0);

  let pointerDownAt = { x: 0, y: 0 };
  const onPointerDown = (e: PointerEvent) => {
    pointerDownAt = { x: e.clientX, y: e.clientY };
  };
  // World position of the wall-panel CSS2DObject
  const _wallPanelPos = new THREE.Vector3(0, CAM_START_Y, ROOM_HALF_D);
  const _toWall = new THREE.Vector3();
  const _camDir = new THREE.Vector3();

  function isAimingAtWallPanel(): boolean {
    camera.getWorldDirection(_camDir);
    _toWall.copy(_wallPanelPos).sub(camera.position).normalize();
    return _camDir.dot(_toWall) > 0.85; // ~32° acceptance cone
  }

  const onPointerUp = (e: PointerEvent) => {
    const dx = e.clientX - pointerDownAt.x;
    const dy = e.clientY - pointerDownAt.y;
    if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD_PX) return;

    // Click during inspect → return book to shelf
    if (inspectedMesh) { exitInspect(); return; }

    if (!controls.isLocked) return;

    // Check for book hit (only when books are placed)
    let hitBook = false;
    if (bookGroup) {
      raycaster.setFromCamera(centre, camera);
      const hits = raycaster.intersectObjects(bookGroup.children, true);
      if (hits.length > 0) {
        const mesh = hits[0].object as THREE.Mesh;
        if (mesh.userData.bookData) { enterInspect(mesh); hitBook = true; }
      }
    }

    // No book hit — check if crosshair is on the wall panel (works even before
    // books are loaded, so the landing-phase input is always reachable with a click).
    if (!hitBook) {
      onBookSelect?.(null);
      if (isAimingAtWallPanel()) {
        controls.animateYawTo(Math.PI); // centre camera on the doorway
        document.exitPointerLock();
        setTimeout(() => {
          wallPanelEl.querySelector<HTMLInputElement>('input')?.focus();
        }, 80);
      }
    }
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointerup', onPointerUp);

  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    css2d.setSize(window.innerWidth, window.innerHeight);
  };
  window.addEventListener('resize', onResize);

  // ── Peek state ─────────────────────────────────────────────────────────────
  let peekedMesh: THREE.Mesh | null = null;

  function setPeek(mesh: THREE.Mesh | null) {
    if (peekedMesh && peekedMesh !== mesh) {
      peekedMesh.userData.peeked   = false;
      peekedMesh.userData.settled  = false; // needs to lerp back to base
    }
    peekedMesh = mesh;
    if (mesh) {
      mesh.userData.peeked  = true;
      mesh.userData.settled = false; // needs to animate outward
    }
  }

  // ── Settle thresholds ──────────────────────────────────────────────────────
  // A book is "settled" when it's close enough to its base that further lerping
  // is imperceptible. We skip ALL per-book work for settled books — the single
  // biggest CPU win with 1 000+ books.
  const SETTLE_POS_EPS2 = 1e-8; // squared-distance in metres
  const SETTLE_ROT_EPS  = 1 - 5e-7; // |quaternion dot| threshold

  // ── Scratch vectors ────────────────────────────────────────────────────────
  const _hoverForward = new THREE.Vector3();
  const _hoverTarget = new THREE.Vector3();
  const _worldY = new THREE.Vector3(0, 1, 0);
  const _peekAxis = new THREE.Vector3();
  const _peekTiltQ = new THREE.Quaternion();
  const _peekQ = new THREE.Quaternion();
  let _lastHovered: THREE.Mesh | null = null;

  // ── Render loop ────────────────────────────────────────────────────────────
  let raf = 0;
  const animate = () => {
    raf = requestAnimationFrame(animate);
    controls.update();

    if (bookGroup) {
      // Entering pointer-lock clears list-peek
      if (controls.isLocked && peekedMesh) setPeek(null);

      // Hover raycasting only when pointer-locked (free-look mode)
      let hoveredMesh: THREE.Mesh | null = null;
      if (controls.isLocked && !inspectedMesh) {
        raycaster.setFromCamera(centre, camera);
        const hits = raycaster.intersectObjects(bookGroup.children, true);
        hoveredMesh = hits.length > 0 ? hits[0].object as THREE.Mesh : null;
      }
      if (hoveredMesh !== _lastHovered) {
        // Un-settle both the previous and new hovered book so they animate.
        if (_lastHovered) _lastHovered.userData.settled = false;
        if (hoveredMesh) {
          hoveredMesh.userData.settled = false;
          hoveredMesh.userData.loadCover?.(); // lazy cover load on first hover
        }
        _lastHovered = hoveredMesh;
        onBookHover?.(hoveredMesh?.userData.bookData ?? null);
      }

      for (const child of bookGroup.children) {
        const mesh = child as THREE.Mesh;
        if (mesh.userData.inspecting) continue;

        const isPeeked  = child === peekedMesh;
        const isHovered = child === hoveredMesh;

        // Fast path: skip settled, non-interactive books entirely.
        // With 1 000+ books this eliminates almost all per-frame work.
        if (mesh.userData.settled && !isPeeked && !isHovered) continue;

        const base     = mesh.userData.basePos  as THREE.Vector3;
        const baseQuat = mesh.userData.baseQuat as THREE.Quaternion;

        // Use precomputed sin/cos stored at placement time (saves 2 400 trig
        // calls per frame that were previously done for every book every tick).
        _hoverForward.set(mesh.userData.hfx as number, 0, mesh.userData.hfz as number);

        if (isPeeked) {
          _hoverTarget.copy(base).addScaledVector(_hoverForward, BOOK_PEEK_OFFSET);
          mesh.position.lerp(_hoverTarget, BOOK_HOVER_LERP);
          _peekAxis.crossVectors(_worldY, _hoverForward).normalize();
          _peekTiltQ.setFromAxisAngle(_peekAxis, BOOK_PEEK_TILT);
          _peekQ.multiplyQuaternions(_peekTiltQ, baseQuat);
          mesh.quaternion.slerp(_peekQ, BOOK_HOVER_LERP);
        } else if (isHovered) {
          _hoverTarget.copy(base).addScaledVector(_hoverForward, BOOK_HOVER_OFFSET);
          mesh.position.lerp(_hoverTarget, BOOK_HOVER_LERP);
          mesh.quaternion.slerp(baseQuat, BOOK_HOVER_LERP);
        } else {
          // Returning to base — check convergence and settle.
          mesh.position.lerp(base, BOOK_HOVER_LERP);
          mesh.quaternion.slerp(baseQuat, BOOK_HOVER_LERP);
          if (
            mesh.position.distanceToSquared(base) < SETTLE_POS_EPS2 &&
            Math.abs(mesh.quaternion.dot(baseQuat)) > SETTLE_ROT_EPS
          ) {
            mesh.position.copy(base);
            mesh.quaternion.copy(baseQuat);
            mesh.userData.settled = true;
          }
        }
      }
    }

    // Inspect: fly book to hold position, face camera, tilt with mouse
    if (inspectedMesh) {
      inspectFillLight.intensity = debugState.inspectFillIntensity;
      inspectFillLight.position.copy(camera.position);

      // Hold position: follow full camera direction including pitch
      camera.getWorldDirection(_inspectDir);
      inspectHoldPos.copy(camera.position).addScaledVector(_inspectDir, INSPECT_DISTANCE);
      inspectedMesh.position.lerp(inspectHoldPos, INSPECT_POS_LERP);

      // Base rotation: build an orthonormal basis so the +X face (cover) points
      // toward the camera and the book stays upright.
      //   bookX = -cameraDir  (cover faces viewer)
      //   bookZ = worldUp × bookX  (lateral / spine direction)
      //   bookY = bookZ × bookX   (recalculated up, orthogonal to both)
      _inspectBookX.copy(_inspectDir).negate();
      _inspectBookZ.crossVectors(_inspectBookX, _worldUp).normalize();
      _inspectBookY.crossVectors(_inspectBookZ, _inspectBookX);
      _inspectMatrix.makeBasis(_inspectBookX, _inspectBookY, _inspectBookZ);
      _inspectBaseQuat.setFromRotationMatrix(_inspectMatrix);

      // Mouse tilt applied in camera-relative space (multiply after base)
      const nx = mouseX / window.innerWidth - 0.5;
      const ny = mouseY / window.innerHeight - 0.5;
      _inspectTiltEul.set(-ny * INSPECT_TILT_X, nx * INSPECT_TILT_Y, 0, 'YXZ');
      _inspectTiltQuat.setFromEuler(_inspectTiltEul);
      _inspectQuat.multiplyQuaternions(_inspectBaseQuat, _inspectTiltQuat);

      inspectedMesh.quaternion.slerp(_inspectQuat, INSPECT_ROT_LERP);
    }

    // Smooth light dimming (loading state)
    if (Math.abs(_targetLightScale - _lightScale) > 0.001) {
      _lightScale += (_targetLightScale - _lightScale) * 0.05;
      for (const { light, base } of dimLights) light.intensity = base * _lightScale;
    }

    renderer.render(scene, camera);
    css2d.render(scene, camera);
  };
  animate();

  return {
    controls,
    wallPanelElement: wallPanelEl,
    loadingElement: loadingEl,
    overlayElement: css2d.domElement,
    setBooks(readBooks, toReadBooks, currentlyReadingBooks) {
      lastBooks = { read: readBooks, toRead: toReadBooks, current: currentlyReadingBooks };
      rebuildBooks();
    },
    lookAtBook(bookId: string) {
      const mesh = bookMeshMap.get(bookId);
      if (mesh) controls.lookAt(mesh.position);
    },
    peekBook(bookId: string | null) {
      setPeek(bookId ? (bookMeshMap.get(bookId) ?? null) : null);
    },
    inspectBook(bookId: string) {
      const mesh = bookMeshMap.get(bookId);
      if (mesh) { controls.lookAt(mesh.position); enterInspect(mesh); }
    },
    turnToBooks() {
      controls.animateYawTo(0); // face back wall (−Z)
    },
    faceDoorway() {
      controls.animateYawTo(Math.PI); // face front wall / doorway (+Z)
    },
    setLoading(v: boolean) {
      _targetLightScale   = v ? debugState.loadingDim : 1;
      controls.frozen     = v;
      loadingObj.visible  = v;
      wallPanelObj.visible = !v;
    },
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('keydown', onKeyDown);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointerup', onPointerUp);
      controls.detach();
      renderer.dispose();
      gui.destroy();
    },
  };
}
