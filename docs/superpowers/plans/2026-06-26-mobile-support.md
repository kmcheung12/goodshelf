# Mobile Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add touch navigation (drag to look, pinch to zoom, tap/double-tap to select/inspect books) and disable the desktop-only list panel on mobile.

**Architecture:** Augment the existing `Controls` class with an `isMobile` flag and touch event handlers. When mobile, `isLocked` is permanently `true` so all downstream scene logic is unchanged. `scene.ts` wires two new callbacks (`onTap`, `onDoubleTap`) to drive book selection. `ShelfScene.svelte` gates the `BookPanel` and keyboard hints behind `!isMobile`.

**Tech Stack:** Three.js, Svelte 5, TypeScript, Vite

## Global Constraints

- No new dependencies
- TypeScript strict — run `npm run check` to verify types after each task
- No test runner exists; verification is type-check + DevTools mobile emulation (Chrome → DevTools → toggle device toolbar, select any phone preset)
- Do not change `LOOK_SENSITIVITY` — same value works for touch pixel deltas

---

### Task 1: Add touch support to Controls

**Files:**
- Modify: `src/lib/three/controls.ts`

**Interfaces:**
- Produces:
  - `new Controls(camera, initialYaw?, isMobile?)` — third param defaults `false`
  - `controls.onTap?: (x: number, y: number) => void` — fired on single tap (< 8px, < 300ms)
  - `controls.onDoubleTap?: (x: number, y: number) => void` — fired when second tap within 300ms, < 30px
  - `controls.isLocked` — always `true` when `isMobile`

- [ ] **Step 1: Replace `src/lib/three/controls.ts` with the mobile-augmented version**

```typescript
import * as THREE from 'three';
import {
  LOOK_SENSITIVITY, PITCH_LIMIT, MOVE_SPEED,
  CAM_XMIN, CAM_XMAX, CAM_ZMIN, CAM_ZMAX,
  CAM_FOV_MIN, CAM_FOV_MAX, SCROLL_ZOOM_SPEED,
} from './constants';
import { debugState } from './debug';

export class Controls {
  private yaw: number;
  private pitch = 0;
  private targetYaw:   number | null = null;
  private targetPitch: number | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private keys = new Set<string>();
  public isLocked = false;
  public frozen   = false;

  // Mobile tap callbacks
  public onTap?: (x: number, y: number) => void;
  public onDoubleTap?: (x: number, y: number) => void;

  // Touch tracking
  private lastTouchX = 0;
  private lastTouchY = 0;
  private touchStartX = 0;
  private touchStartY = 0;
  private touchStartTime = 0;
  private lastTapX = 0;
  private lastTapY = 0;
  private lastTapTime = 0;
  private pinchDist = 0;

  private readonly _euler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly _yawEuler = new THREE.Euler(0, 0, 0, 'YXZ');
  private readonly _quat = new THREE.Quaternion();
  private readonly _dir = new THREE.Vector3();

  constructor(
    private camera: THREE.PerspectiveCamera,
    initialYaw = 0,
    private isMobile = false,
  ) {
    this.yaw = initialYaw;
    if (isMobile) this.isLocked = true;
  }

  animateYawTo(target: number) {
    this.targetYaw = target;
  }

  attach(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    if (this.isMobile) {
      canvas.addEventListener('touchstart', this.onTouchStart, { passive: false });
      canvas.addEventListener('touchmove',  this.onTouchMove,  { passive: false });
      canvas.addEventListener('touchend',   this.onTouchEnd);
    } else {
      canvas.addEventListener('click', this.onClick);
      document.addEventListener('pointerlockchange', this.onLockChange);
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('keydown', this.onKeyDown);
      document.addEventListener('keyup', this.onKeyUp);
      canvas.addEventListener('wheel', this.onWheel, { passive: false });
    }
  }

  detach() {
    if (!this.canvas) return;
    if (this.isMobile) {
      this.canvas.removeEventListener('touchstart', this.onTouchStart);
      this.canvas.removeEventListener('touchmove',  this.onTouchMove);
      this.canvas.removeEventListener('touchend',   this.onTouchEnd);
    } else {
      this.canvas.removeEventListener('click', this.onClick);
      document.removeEventListener('pointerlockchange', this.onLockChange);
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('keydown', this.onKeyDown);
      document.removeEventListener('keyup', this.onKeyUp);
      this.canvas.removeEventListener('wheel', this.onWheel);
    }
    this.keys.clear();
    this.canvas = null;
  }

  private onClick = () => {
    if (!this.isLocked && this.canvas) {
      this.canvas.requestPointerLock();
    }
  };

  private onLockChange = () => {
    this.isLocked = document.pointerLockElement === this.canvas;
  };

  private onMouseMove = (e: MouseEvent) => {
    if (!this.isLocked || this.frozen) return;
    this.targetYaw   = null;
    this.targetPitch = null;
    this.yaw   -= e.movementX * LOOK_SENSITIVITY;
    this.pitch -= e.movementY * LOOK_SENSITIVITY;
    this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
  };

  private onKeyDown = (e: KeyboardEvent) => { this.keys.add(e.code); };
  private onKeyUp   = (e: KeyboardEvent) => { this.keys.delete(e.code); };

  private onWheel = (e: WheelEvent) => {
    e.preventDefault();
    const fov = this.camera.fov + e.deltaY * SCROLL_ZOOM_SPEED;
    this.camera.fov = Math.max(CAM_FOV_MIN, Math.min(CAM_FOV_MAX, fov));
    this.camera.updateProjectionMatrix();
  };

  private onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1) {
      const t = e.touches[0];
      this.lastTouchX     = t.clientX;
      this.lastTouchY     = t.clientY;
      this.touchStartX    = t.clientX;
      this.touchStartY    = t.clientY;
      this.touchStartTime = Date.now();
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      this.pinchDist = Math.sqrt(dx * dx + dy * dy);
    }
  };

  private onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && !this.frozen) {
      const t  = e.touches[0];
      const dx = t.clientX - this.lastTouchX;
      const dy = t.clientY - this.lastTouchY;
      this.targetYaw   = null;
      this.targetPitch = null;
      this.yaw   -= dx * LOOK_SENSITIVITY;
      this.pitch -= dy * LOOK_SENSITIVITY;
      this.pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, this.pitch));
      this.lastTouchX = t.clientX;
      this.lastTouchY = t.clientY;
    } else if (e.touches.length === 2) {
      const dx   = e.touches[0].clientX - e.touches[1].clientX;
      const dy   = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const delta = this.pinchDist - dist;
      this.camera.fov = Math.max(CAM_FOV_MIN, Math.min(CAM_FOV_MAX, this.camera.fov + delta * SCROLL_ZOOM_SPEED));
      this.camera.updateProjectionMatrix();
      this.pinchDist = dist;
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (e.changedTouches.length === 0) return;
    const t        = e.changedTouches[0];
    const dx       = t.clientX - this.touchStartX;
    const dy       = t.clientY - this.touchStartY;
    const moveDist = Math.sqrt(dx * dx + dy * dy);
    const elapsed  = Date.now() - this.touchStartTime;

    if (moveDist < 8 && elapsed < 300) {
      const since   = Date.now() - this.lastTapTime;
      const ddx     = t.clientX - this.lastTapX;
      const ddy     = t.clientY - this.lastTapY;
      const tapDist = Math.sqrt(ddx * ddx + ddy * ddy);

      if (since < 300 && tapDist < 30) {
        this.onDoubleTap?.(t.clientX, t.clientY);
        this.lastTapTime = 0; // reset so triple-tap doesn't re-fire
      } else {
        this.onTap?.(t.clientX, t.clientY);
        this.lastTapX    = t.clientX;
        this.lastTapY    = t.clientY;
        this.lastTapTime = Date.now();
      }
    }
  };

  lookAt(target: THREE.Vector3) {
    const dx = target.x - this.camera.position.x;
    const dy = target.y - this.camera.position.y;
    const dz = target.z - this.camera.position.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    this.targetYaw   = null;
    this.targetPitch = null;
    this.yaw   = Math.atan2(-dx, -dz);
    this.pitch = Math.atan2(dy, horizDist);
  }

  smoothLookAt(target: THREE.Vector3) {
    const dx = target.x - this.camera.position.x;
    const dy = target.y - this.camera.position.y;
    const dz = target.z - this.camera.position.z;
    const horizDist = Math.sqrt(dx * dx + dz * dz);
    this.targetYaw   = Math.atan2(-dx, -dz);
    this.targetPitch = Math.atan2(dy, horizDist);
  }

  update() {
    if (this.targetYaw !== null) {
      let d = this.targetYaw - this.yaw;
      d = d - 2 * Math.PI * Math.round(d / (2 * Math.PI));
      if (Math.abs(d) < 0.003) {
        this.yaw = this.targetYaw;
        this.targetYaw = null;
      } else {
        this.yaw += d * debugState.yawTurnSpeed;
      }
    }

    if (this.targetPitch !== null) {
      const d = this.targetPitch - this.pitch;
      if (Math.abs(d) < 0.003) {
        this.pitch = this.targetPitch;
        this.targetPitch = null;
      } else {
        this.pitch += d * debugState.yawTurnSpeed;
      }
    }

    this._euler.set(this.pitch, this.yaw, 0);
    this.camera.quaternion.setFromEuler(this._euler);

    if (!this.isLocked || this.frozen) return;
    // WASD movement (desktop only — mobile has no keyboard)
    if (this.isMobile) return;
    this._dir.set(0, 0, 0);
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp'))    this._dir.z -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown'))  this._dir.z += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft'))  this._dir.x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) this._dir.x += 1;
    if (this._dir.lengthSq() === 0) return;

    this._dir.normalize().multiplyScalar(MOVE_SPEED);
    this._yawEuler.set(0, this.yaw, 0);
    this._dir.applyQuaternion(this._quat.setFromEuler(this._yawEuler));

    const p = this.camera.position;
    p.x = Math.max(CAM_XMIN, Math.min(CAM_XMAX, p.x + this._dir.x));
    p.z = Math.max(CAM_ZMIN, Math.min(CAM_ZMAX, p.z + this._dir.z));
  }
}
```

- [ ] **Step 2: Type-check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/three/controls.ts
git commit -m "feat: add touch support to Controls (mobile drag, pinch, tap/double-tap)"
```

---

### Task 2: Wire mobile input in scene.ts

**Files:**
- Modify: `src/lib/three/scene.ts`

**Interfaces:**
- Consumes:
  - `new Controls(camera, initialYaw, isMobile)` from Task 1
  - `controls.onTap`, `controls.onDoubleTap` from Task 1
- Produces: no new public API — changes are internal to `initScene`

- [ ] **Step 1: Detect mobile and pass flag to Controls**

In `src/lib/three/scene.ts`, find the line:

```typescript
  const controls = new Controls(camera, Math.PI); // start facing the doorway (+Z)
```

Replace with:

```typescript
  const isMobile = 'ontouchstart' in window;
  const controls = new Controls(camera, Math.PI, isMobile); // start facing the doorway (+Z)
```

- [ ] **Step 2: Add `raycastAt` helper**

In `scene.ts`, just after the `raycaster` and `centre` declarations (around line 203–204):

```typescript
  const raycaster = new THREE.Raycaster();
  const centre = new THREE.Vector2(0, 0);
```

Add immediately after:

```typescript
  const _ndc = new THREE.Vector2();
  function raycastAt(clientX: number, clientY: number): THREE.Mesh | null {
    if (!bookGroup) return null;
    _ndc.set(
      (clientX / window.innerWidth) * 2 - 1,
      -(clientY / window.innerHeight) * 2 + 1,
    );
    raycaster.setFromCamera(_ndc, camera);
    const hits = raycaster.intersectObjects(bookGroup.children, true);
    return hits.length > 0 ? hits[0].object as THREE.Mesh : null;
  }
```

- [ ] **Step 3: Wire `onTap` and `onDoubleTap`**

In `scene.ts`, find where `controls.attach(canvas)` is called. After that line, add:

```typescript
  controls.onTap = (x, y) => {
    if (inspectedMesh) { exitInspect(); return; }
    const hit = raycastAt(x, y);
    if (hit?.userData.bookData) {
      setPeek(hit);
      onBookHover?.(hit.userData.bookData);
      onBookSelect?.(hit.userData.bookData);
    } else {
      setPeek(null);
      onBookHover?.(null);
      onBookSelect?.(null);
    }
  };

  controls.onDoubleTap = (x, y) => {
    const hit = raycastAt(x, y);
    if (hit?.userData.bookData) enterInspect(hit);
  };
```

- [ ] **Step 4: Skip `requestPointerLock` on mobile in exitInspect**

Find `exitInspect()`:

```typescript
  function exitInspect() {
    if (!inspectedMesh) return;
    inspectedMesh.userData.inspecting = false;
    inspectedMesh = null;
    inspectFillLight.intensity = 0;
    onBookSelect?.(null);
    onInspectChange?.(false);
    _lastHovered = null;
    onBookHover?.(null);
  }
```

There is one call site that does `exitInspect(); canvas.requestPointerLock()` — in `onPointerUp`:

```typescript
    if (inspectedMesh) { exitInspect(); canvas.requestPointerLock(); return; }
```

Replace that line with:

```typescript
    if (inspectedMesh) { exitInspect(); if (!isMobile) canvas.requestPointerLock(); return; }
```

- [ ] **Step 5: Type-check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/three/scene.ts
git commit -m "feat: wire mobile tap/double-tap in scene, skip pointer lock on mobile"
```

---

### Task 3: Mobile UI in ShelfScene.svelte

**Files:**
- Modify: `src/components/ShelfScene.svelte`

**Interfaces:**
- Consumes: nothing new — internal component state changes only

- [ ] **Step 1: Detect mobile and gate the F-key listener**

In `ShelfScene.svelte`, in the `<script>` block, add after the existing `let` declarations:

```typescript
  const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window;
```

Find the `onKeyDown` listener inside `onMount`:

```typescript
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && handle!.controls.isLocked) {
        showPanel = !showPanel;
      }
    };
    document.addEventListener('keydown', onKeyDown);
```

Wrap it so it only registers on desktop:

```typescript
    let onKeyDown: ((e: KeyboardEvent) => void) | undefined;
    if (!isMobile) {
      onKeyDown = (e: KeyboardEvent) => {
        if (e.code === 'KeyF' && handle!.controls.isLocked) {
          showPanel = !showPanel;
        }
      };
      document.addEventListener('keydown', onKeyDown);
    }
```

Update the cleanup in the `onMount` return to guard the removal:

```typescript
    return () => {
      clearInterval(interval);
      if (onKeyDown) document.removeEventListener('keydown', onKeyDown);
    };
```

- [ ] **Step 2: Gate BookPanel behind `!isMobile`**

Find the `{#if showPanel}` block:

```svelte
{#if showPanel}
<BookPanel
  ...
/>
{/if}
```

Replace with:

```svelte
{#if showPanel && !isMobile}
<BookPanel
  readBooks={placedReadBooks}
  toReadBooks={placedToReadBooks}
  currentlyReadingBooks={placedCurrentlyReadingBooks}
  {hoveredBook}
  {locked}
  onLookAt={(id) => { handle?.lookAtBook(id); handle?.peekBook(id); }}
  onSelectBook={(book) => { hoveredBook = book; onBookSelect(book); }}
  onInspectBook={(book) => { handle?.inspectBook(book.id); }}
/>
{/if}
```

- [ ] **Step 3: Hide Crosshair and update hint text for mobile**

Find the `<Crosshair {locked} />` line and gate it:

```svelte
{#if !isMobile}
  <Crosshair {locked} />
{/if}
```

Find the hint block:

```svelte
  {#if inspecting}
    <div class="hint">Click anywhere to put it back · Move mouse to rotate</div>
  {:else if !locked}
    {#if phase === 'browsing'}
      <div class="hint">Click to move around · Scroll to zoom · WASD to move · Turn around to search</div>
    {:else}
      <div class="hint">Click to move around</div>
    {/if}
  {/if}
```

Replace with:

```svelte
  {#if isMobile}
    {#if inspecting}
      <div class="hint">Tap anywhere to put it back · Move finger to rotate</div>
    {:else if phase === 'browsing'}
      <div class="hint">Drag to look · Tap a book · Double-tap to inspect</div>
    {:else}
      <div class="hint">Drag to look around</div>
    {/if}
  {:else if inspecting}
    <div class="hint">Click anywhere to put it back · Move mouse to rotate</div>
  {:else if !locked}
    {#if phase === 'browsing'}
      <div class="hint">Click to move around · Scroll to zoom · WASD to move · Turn around to search</div>
    {:else}
      <div class="hint">Click to move around</div>
    {/if}
  {/if}
```

- [ ] **Step 4: Type-check**

```bash
npm run check
```

Expected: no errors.

- [ ] **Step 5: Manual verify in Chrome DevTools mobile emulation**

1. Run `npm run dev`
2. Open Chrome DevTools → toggle device toolbar → select "iPhone 12 Pro" (or any phone)
3. Reload the page
4. Verify:
   - Drag with one finger → camera looks around
   - Pinch with two fingers → FOV changes (zoom in/out)
   - No crosshair visible
   - Bottom hint reads "Drag to look around" (landing) or "Drag to look · Tap a book · Double-tap to inspect" (browsing)
   - No `BookPanel` appears at any point
   - Enter a Goodreads user ID — books load and appear on shelves
   - Tap a book → it peeks outward, tooltip appears
   - Double-tap that book → it flies to camera (inspect mode)
   - Tap anywhere while inspecting → book returns to shelf

- [ ] **Step 6: Commit**

```bash
git add src/components/ShelfScene.svelte
git commit -m "feat: mobile UI — disable list panel, show touch hints, hide crosshair"
```
