# Mobile Support Design

**Date:** 2026-06-26

## Overview

Add touch navigation to the 3D bookshelf viewer and disable the desktop-only list panel on mobile. The existing `Controls` class is augmented with touch handlers; the rest of the scene logic is unchanged.

## Mobile Detection

`'ontouchstart' in window` at construction time sets a `isMobile` boolean on `Controls`. This is passed into `scene.ts` and `ShelfScene.svelte` as needed.

## Controls (`src/lib/three/controls.ts`)

### Constructor change
- Accept `isMobile` flag (default `false`).
- When `isMobile`, initialize `isLocked = true` and never call `requestPointerLock`.

### `attach()` / `detach()`
- When `isMobile`: register `touchstart`, `touchmove`, `touchend` on the canvas instead of the existing mouse/pointer-lock listeners. Keyboard listeners are omitted.
- When not mobile: behaviour unchanged.

### Touch gesture handling

**Single-finger drag (look around)**
- `touchstart`: record `lastTouchX`, `lastTouchY`, start timestamp, start position (for tap detection).
- `touchmove` (one active touch): compute delta from last position, apply to `yaw`/`pitch` using `LOOK_SENSITIVITY`. Clamp pitch to `PITCH_LIMIT`. Cancel any programmatic `targetYaw`/`targetPitch`.
- `touchend`: classify gesture (see below).

**Tap / double-tap**
- On `touchend`, if movement < 8px and duration < 300ms → tap.
- Double-tap: if a tap fires within 300ms of the previous tap at ≤ 30px distance → double-tap.
- Fire callbacks `onTap(x, y)` or `onDoubleTap(x, y)` (both optional `(x: number, y: number) => void` properties on `Controls`).

**Two-finger pinch (zoom)**
- `touchstart` with 2 touches: record initial distance between fingers.
- `touchmove` with 2 touches: compute new distance, map delta → FOV change using `SCROLL_ZOOM_SPEED`. Clamp to `[CAM_FOV_MIN, CAM_FOV_MAX]`.

### No changes to `update()` or animation logic.

## Scene (`src/lib/three/scene.ts`)

### Detect mobile
```ts
const isMobile = 'ontouchstart' in window;
const controls = new Controls(camera, Math.PI, isMobile);
```

### Wire tap callbacks
```ts
controls.onTap = (x, y) => {
  if (inspectedMesh) { exitInspect(); return; }
  const hit = raycastAt(x, y);
  if (hit?.userData.bookData) {
    setPeek(hit);
    onBookHover?.(hit.userData.bookData);
    onBookSelect?.(hit.userData.bookData);
  } else {
    setPeek(null);
    onBookSelect?.(null);
  }
};

controls.onDoubleTap = (x, y) => {
  const hit = raycastAt(x, y);
  if (hit?.userData.bookData) enterInspect(hit);
};
```

A small helper `raycastAt(x, y)` converts screen coords to NDC, sets `raycaster.setFromCamera`, intersects `bookGroup`, returns the first hit mesh or `null`.

### Exit inspect on mobile
- `exitInspect()` skips `canvas.requestPointerLock()` when `isMobile`.

## ShelfScene.svelte (`src/components/ShelfScene.svelte`)

- Detect `isMobile` once: `const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window`.
- Gate `showPanel` and the `keydown` listener for `F` behind `!isMobile`. On mobile `showPanel` is always `false`; `BookPanel` is never rendered.
- Hint text: when mobile, show `"Drag to look · Tap a book · Double-tap to inspect"`. Hide `Crosshair` on mobile.
- The book tooltip (`hoveredBook` display) is unchanged — it shows whenever `hoveredBook` is set, which is now driven by tap callbacks.

## Files Changed

| File | Change |
|------|--------|
| `src/lib/three/controls.ts` | Add `isMobile`, touch listeners, `onTap`/`onDoubleTap` callbacks |
| `src/lib/three/scene.ts` | Pass `isMobile` to `Controls`, wire `onTap`/`onDoubleTap`, skip `requestPointerLock` on exit-inspect |
| `src/components/ShelfScene.svelte` | Gate `BookPanel`/`F` key behind `!isMobile`, mobile hint text, hide `Crosshair` on mobile |

## Out of Scope

- Joystick / on-screen D-pad for movement (mobile users don't need WASD; looking around is sufficient)
- Haptic feedback
- WallPanel touch input (the existing CSS2DObject panel is already pointer-events enabled and works with touch)
