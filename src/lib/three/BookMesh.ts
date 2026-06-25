import * as THREE from 'three';
import type { BookData } from '../adapters/types';
import {
  CASE_HEIGHT, CASE_DEPTH, SPINE_THICKNESS,
  SPINE_CANVAS_W, SPINE_CANVAS_H,
  SPINE_ROUGHNESS, SPINE_METALNESS,
  SPINE_PALETTE,
} from './constants';

function luminanceFromRGB(r: number, g: number, b: number): number {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

function luminance(hex: string): number {
  return luminanceFromRGB(
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  );
}

// Sample average RGB from a loaded image element (4×4 downscale)
function dominantRGB(img: HTMLImageElement): [number, number, number] | null {
  try {
    const c = document.createElement('canvas');
    c.width = 4; c.height = 4;
    const ctx = c.getContext('2d')!;
    ctx.drawImage(img, 0, 0, 4, 4);
    const data = ctx.getImageData(0, 0, 4, 4).data;
    let r = 0, g = 0, b = 0;
    const n = data.length / 4;
    for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
    return [Math.round(r / n), Math.round(g / n), Math.round(b / n)];
  } catch {
    return null; // CORS blocked — graceful fallback
  }
}

export function makeSpineTexture(
  title: string,
  author: string,
  color: string
): THREE.CanvasTexture {
  const W = SPINE_CANVAS_W;
  const H = SPINE_CANVAS_H;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const BAR_H = 28;
  const TITLE_LANE_X = W / 2 + 7;
  const AUTHOR_LANE_X = W / 2 - 9;
  const TEXT_START_Y = H - 36;
  const TEXT_MAX_W = H - 72;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, W, BAR_H);
  ctx.fillRect(0, H - BAR_H, W, BAR_H);

  const onDark = luminance(color) < 0.45;
  const ink = onDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)';
  const inkFaint = onDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';

  ctx.save();
  ctx.translate(TITLE_LANE_X, TEXT_START_Y);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `bold 15px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(title.length > 40 ? title.slice(0, 38) + '…' : title, 0, 0, TEXT_MAX_W);
  ctx.restore();

  ctx.save();
  ctx.translate(AUTHOR_LANE_X, TEXT_START_Y);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `11px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = inkFaint;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(author.length > 30 ? author.slice(0, 28) + '…' : author, 0, 0, TEXT_MAX_W);
  ctx.restore();

  return new THREE.CanvasTexture(canvas);
}

const loader = new THREE.TextureLoader();
loader.crossOrigin = 'anonymous';

export function createBookMesh(book: BookData, index: number): THREE.Mesh {
  const initialColor = book.spineColor ?? SPINE_PALETTE[index % SPINE_PALETTE.length];
  let spineTex = makeSpineTexture(book.title, book.author, initialColor);

  const sideMat = new THREE.MeshStandardMaterial({
    color: initialColor,
    roughness: SPINE_ROUGHNESS,
    metalness: SPINE_METALNESS,
  });

  const spineMat = new THREE.MeshStandardMaterial({
    map: spineTex,
    roughness: SPINE_ROUGHNESS,
    metalness: SPINE_METALNESS,
  });

  const coverMat = new THREE.MeshStandardMaterial({
    color: initialColor,
    roughness: SPINE_ROUGHNESS,
    metalness: SPINE_METALNESS,
  });

  // BoxGeometry face order: +X, -X, +Y, -Y, +Z (spine), -Z (cover)
  const materials = [sideMat, sideMat, sideMat, sideMat, spineMat, coverMat];

  const geo = new THREE.BoxGeometry(SPINE_THICKNESS, CASE_HEIGHT, CASE_DEPTH);
  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.bookData = book;

  if (book.coverUrl) {
    loader.load(book.coverUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;

      // Extract dominant color from cover to tint the spine
      const rgb = dominantRGB(tex.image as HTMLImageElement);
      if (rgb) {
        const [r, g, b] = rgb;
        const cssColor = `rgb(${r},${g},${b})`;

        // Regenerate spine texture with cover-derived color
        const oldTex = spineTex;
        spineTex = makeSpineTexture(book.title, book.author, cssColor);
        spineMat.map = spineTex;
        spineMat.needsUpdate = true;
        oldTex.dispose();

        // Update side/top/bottom faces to match
        sideMat.color.set(cssColor);
        sideMat.needsUpdate = true;
      }

      // Apply cover image to the -Z face
      coverMat.map = tex;
      coverMat.color.set(0xffffff);
      coverMat.needsUpdate = true;
    }, undefined, () => {
      console.warn(`[BookMesh] Failed to load cover for "${book.title}"`);
    });
  }

  return mesh;
}
