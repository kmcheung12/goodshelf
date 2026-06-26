import * as THREE from 'three';
import type { BookData } from '../adapters/types';
import {
  CASE_HEIGHT, CASE_DEPTH, SPINE_THICKNESS,
  SPINE_CANVAS_W, SPINE_CANVAS_H,
  SPINE_ROUGHNESS_MIN, SPINE_ROUGHNESS_MAX, SPINE_METALNESS,
  SPINE_NORMAL_W, SPINE_NORMAL_H, SPINE_CURVE_ANGLE,
  SPINE_PALETTE,
} from './constants';
import { debugState } from './debug';

// Deterministic float 0–1 from an integer seed (single-step LCG).
function seededFloat(seed: number): number {
  const s = (Math.imul((seed | 0), 1664525) + 1013904223) >>> 0;
  return s / 0x100000000;
}

// Multi-value LCG seeded per book — for normal-map noise.
function makeLCG(seed: number): () => number {
  let s = ((seed | 0) * 1664525 + 1013904223) >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

function luminanceFromRGB(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function luminance(color: string): number {
  if (color.startsWith('#')) {
    return luminanceFromRGB(
      parseInt(color.slice(1, 3), 16),
      parseInt(color.slice(3, 5), 16),
      parseInt(color.slice(5, 7), 16),
    );
  }
  // rgb(r,g,b) — produced after dominant-color extraction from cover image
  const m = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (m) return luminanceFromRGB(+m[1], +m[2], +m[3]);
  return 0;
}

function dominantRGB(img: HTMLImageElement): [number, number, number] | null {
  try {
    const c = document.createElement('canvas');
    const dim = 4;
    c.width = dim; c.height = dim;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, dim, dim);
    const data = ctx.getImageData(0, 0, 4, 4).data;
    let r = 0, g = 0, b = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  } catch {
    return null;
  }
}

export function makeSpineTexture(title: string, author: string, color: string): THREE.CanvasTexture {
  const W = SPINE_CANVAS_W;
  const H = SPINE_CANVAS_H;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const BAR_H = 28;
  const TITLE_LANE_X = W / 2 + 7;
  const AUTHOR_LANE_X = W / 2 - 9;
  const TEXT_START_Y = 36;
  const TEXT_MAX_W = H - 72;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, W, BAR_H);
  ctx.fillRect(0, H - BAR_H, W, BAR_H);

  const onDark = luminance(color) < debugState.luminanceThreshold;
  const ink = onDark ? '#ffffff' : 'rgba(0,0,0,0.85)';
  const inkFaint = onDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';

  ctx.save();
  ctx.translate(TITLE_LANE_X, TEXT_START_Y);
  ctx.rotate(Math.PI / 2);
  ctx.font = `bold 22px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.length > 40 ? title.slice(0, 38) + '…' : title, 0, 0, TEXT_MAX_W);
  ctx.restore();

  ctx.save();
  ctx.translate(AUTHOR_LANE_X, TEXT_START_Y);
  ctx.rotate(Math.PI / 2);
  ctx.font = `11px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = inkFaint;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(author.length > 30 ? author.slice(0, 28) + '…' : author, 0, 0, TEXT_MAX_W);
  ctx.restore();

  // Edge shadow — simulates worn corners and reinforces the normal-map curvature
  const edgeDarken = debugState.edgeDarken;
  if (edgeDarken > 0) {
    // Left edge (spine meets front cover) — concentrated, fast falloff
    const lg = ctx.createLinearGradient(0, 0, W * 0.25, 0);
    lg.addColorStop(0,    `rgba(0,0,0,${edgeDarken})`);
    lg.addColorStop(0.45, `rgba(0,0,0,${edgeDarken * 0.3})`);
    lg.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = lg;
    ctx.fillRect(0, 0, W, H);

    // Right edge (spine meets back cover)
    const rg = ctx.createLinearGradient(W, 0, W * 0.75, 0);
    rg.addColorStop(0,    `rgba(0,0,0,${edgeDarken})`);
    rg.addColorStop(0.45, `rgba(0,0,0,${edgeDarken * 0.3})`);
    rg.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, W, H);

    // Top and bottom edges (where you grab the book)
    const edgeH = H * 0.06;
    const tg = ctx.createLinearGradient(0, 0, 0, edgeH);
    tg.addColorStop(0, `rgba(0,0,0,${edgeDarken})`);
    tg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = tg;
    ctx.fillRect(0, 0, W, H);

    const bg = ctx.createLinearGradient(0, H, 0, H - edgeH);
    bg.addColorStop(0, `rgba(0,0,0,${edgeDarken})`);
    bg.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
  }

  return new THREE.CanvasTexture(canvas);
}

export function makeSpineNormalMap(seed: number, grain = debugState.grainStrength): THREE.CanvasTexture {
  const W = SPINE_NORMAL_W;
  const H = SPINE_NORMAL_H;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const imageData = ctx.createImageData(W, H);
  const data = imageData.data;
  const maxAngle = SPINE_CURVE_ANGLE * (Math.PI / 180);
  const rand = makeLCG(seed);

  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      // u ∈ [0,1] across spine width; convex arc → normals tilt inward at edges
      const u = W > 1 ? x / (W - 1) : 0.5;
      const angle = maxAngle * (2 * u - 1);
      const nx = Math.sin(angle);   // tangent-space X
      // Y has no curvature; just grain
      const noiseX = (rand() - 0.5) * 2 * grain;
      const noiseY = (rand() - 0.5) * 2 * grain;

      const r = Math.round((nx * 0.5 + 0.5) * 255 + noiseX);
      const g = Math.round(128 + noiseY);

      const i = (y * W + x) * 4;
      data[i + 0] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = 255; // Z always forward
      data[i + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  return new THREE.CanvasTexture(canvas);
}

// BoxGeometry(SPINE_THICKNESS, CASE_HEIGHT, CASE_DEPTH) face order:
//   +X (0-5)   : wide face CASE_HEIGHT×CASE_DEPTH = front cover  → materialIndex 2
//   -X (6-11)  : wide face                         = back cover   → materialIndex 2 (same)
//   +Y (12-17) : top
//   -Y (18-23) : bottom
//   +Z (24-29) : thin face SPINE_THICKNESS×CASE_HEIGHT = SPINE    → materialIndex 1
//   -Z (30-35) : thin face                          = fore-edge   → materialIndex 0 (side)
const SHARED_BOOK_GEO: THREE.BufferGeometry = (() => {
  const geo = new THREE.BoxGeometry(SPINE_THICKNESS, CASE_HEIGHT, CASE_DEPTH);
  geo.groups = [
    { start: 0,  count: 6,  materialIndex: 2 }, // +X = front cover
    { start: 6,  count: 6,  materialIndex: 2 }, // -X = back cover (same material)
    { start: 12, count: 12, materialIndex: 0 }, // +Y, -Y = top/bottom
    { start: 24, count: 6,  materialIndex: 1 }, // +Z = spine
    { start: 30, count: 6,  materialIndex: 0 }, // -Z = fore-edge
  ];
  return geo;
})();

const PROXY_URL    = import.meta.env.VITE_PROXY_URL ?? 'http://localhost:3001';
const IS_EXTENSION = import.meta.env.VITE_IS_EXTENSION === 'true';

const loader = new THREE.TextureLoader();

// ── Cover load queue ──────────────────────────────────────────────────────────
// Rate-limit concurrent cover fetches so 1 000+ books don't all try to load
// simultaneously, which would saturate the browser's connection pool and spike
// the main thread.
const MAX_COVER_CONCURRENT = 8;
let _coverActive = 0;
const _coverQueue: Array<() => void> = [];

function enqueueCover(fn: () => Promise<void>): void {
  const run = () => {
    _coverActive++;
    fn().finally(() => {
      _coverActive--;
      if (_coverQueue.length > 0) _coverQueue.shift()!();
    });
  };
  if (_coverActive < MAX_COVER_CONCURRENT) run();
  else _coverQueue.push(run);
}

// ── Spine texture idle queue ───────────────────────────────────────────────────
// makeSpineTexture() creates a canvas, fills it, and rasterises text — about
// 0.5–2 ms each.  For 1 200 books that's a 600 ms–2 400 ms synchronous block
// during layout.  We spread the work across idle frames instead.
const _spineQueue: Array<() => void> = [];
let   _spineScheduled = false;

function enqueueSpine(fn: () => void): void {
  _spineQueue.push(fn);
  if (!_spineScheduled) {
    _spineScheduled = true;
    scheduleSpineFlush();
  }
}

function scheduleSpineFlush(): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(flushSpineQueue, { timeout: 150 });
  } else {
    setTimeout(flushSpineQueue, 0);
  }
}

function flushSpineQueue(deadline?: IdleDeadline): void {
  // Process up to 40 per flush, but stop early if the frame is getting long.
  let n = 0;
  while (_spineQueue.length > 0 && n < 40) {
    if (deadline && deadline.timeRemaining() < 1 && n > 0) break;
    _spineQueue.shift()!();
    n++;
  }
  if (_spineQueue.length > 0) {
    scheduleSpineFlush();
  } else {
    _spineScheduled = false;
  }
}

export function createBookMesh(book: BookData, index: number): THREE.Mesh {
  const initialColor = book.spineColor ?? SPINE_PALETTE[index % SPINE_PALETTE.length];

  // Per-book roughness: deterministic from seed, within the debug-tunable range
  const roughness = debugState.roughnessMin +
    seededFloat(index) * (debugState.roughnessMax - debugState.roughnessMin);

  const sideMat = new THREE.MeshStandardMaterial({
    color: initialColor,
    roughness,
    metalness: SPINE_METALNESS,
  });
  // Start with a plain colour — canvas texture is queued for idle creation so
  // placing 1 200 books doesn't block the main thread for ~1–2 seconds.
  const spineMat = new THREE.MeshStandardMaterial({
    color: initialColor,
    roughness,
    metalness: SPINE_METALNESS,
  });
  const coverMat = new THREE.MeshStandardMaterial({
    color: initialColor,
    roughness,
    metalness: SPINE_METALNESS,
  });

  // 3 materials matching the 3 merged groups: sides | spine | cover
  const mesh = new THREE.Mesh(SHARED_BOOK_GEO, [sideMat, spineMat, coverMat]);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.userData.bookData = book;

  // Track current spine colour so the idle callback uses the best known value.
  let spineColor = initialColor;
  let spineTex: THREE.CanvasTexture | null = null;
  let spineNormalTex: THREE.CanvasTexture | null = null;

  function applySpineTexture(color: string) {
    const oldTex = spineTex;
    const oldNormal = spineNormalTex;

    const isDark = luminance(color) < debugState.luminanceThreshold;
    spineTex = makeSpineTexture(book.title, book.author, color);
    spineNormalTex = makeSpineNormalMap(index, isDark ? 0 : debugState.grainStrength);

    spineMat.map = spineTex;
    spineMat.normalMap = spineNormalTex;
    spineMat.normalScale.set(debugState.normalScale, debugState.normalScale);
    spineMat.color.set(0xffffff); // texture provides all colour
    spineMat.needsUpdate = true;

    oldTex?.dispose();
    oldNormal?.dispose();
  }

  // Schedule spine canvas creation during browser idle time.
  enqueueSpine(() => applySpineTexture(spineColor));

  if (book.coverUrl) {
    enqueueCover(() => {
      const resolveCoverUrl = IS_EXTENSION
        ? fetch(book.coverUrl!)
            .then((r) => r.blob())
            .then((blob) => URL.createObjectURL(blob))
        : Promise.resolve(`${PROXY_URL}/cover?url=${encodeURIComponent(book.coverUrl!)}`);

      return resolveCoverUrl.then((coverSrc) => new Promise<void>((resolve) => {
        loader.load(coverSrc, (tex) => {
          if (IS_EXTENSION) URL.revokeObjectURL(coverSrc);
          tex.colorSpace = THREE.SRGBColorSpace;

          const rgb = dominantRGB(tex.image as HTMLImageElement);
          if (rgb) {
            const [r, g, b] = rgb;
            spineColor = `rgb(${r},${g},${b})`;
            sideMat.color.set(spineColor);
            sideMat.needsUpdate = true;
            // Re-generate the spine texture with the better colour (idle).
            enqueueSpine(() => applySpineTexture(spineColor));
          }

          coverMat.map = tex;
          coverMat.color.set(0xffffff);
          coverMat.needsUpdate = true;
          resolve();
        }, undefined, () => {
          console.warn(`[BookMesh] Failed to load cover for "${book.title}"`);
          resolve();
        });
      })).catch(() => {});
    });
  }

  return mesh;
}
