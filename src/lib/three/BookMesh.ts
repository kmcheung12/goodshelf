import * as THREE from 'three';
import type { BookData } from '../adapters/types';
import {
  CASE_HEIGHT, CASE_DEPTH, SPINE_THICKNESS,
  SPINE_CANVAS_W, SPINE_CANVAS_H,
  SPINE_ROUGHNESS, SPINE_METALNESS,
  SPINE_PALETTE,
} from './constants';

function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
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

  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);

  // Top/bottom colour bars
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fillRect(0, 0, W, 28);
  ctx.fillRect(0, H - 28, W, 28);

  const onDark = luminance(color) < 0.45;
  const ink = onDark ? 'rgba(255,255,255,0.92)' : 'rgba(0,0,0,0.85)';
  const inkFaint = onDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)';

  // Title — rotated text running bottom-to-top along spine
  ctx.save();
  ctx.translate(W / 2 + 7, H - 36);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `bold 15px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = ink;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const maxW = H - 72;
  const displayTitle = title.length > 40 ? title.slice(0, 38) + '…' : title;
  ctx.fillText(displayTitle, 0, 0, maxW);
  ctx.restore();

  // Author — offset to second lane
  ctx.save();
  ctx.translate(W / 2 - 9, H - 36);
  ctx.rotate(-Math.PI / 2);
  ctx.font = `11px "Helvetica Neue", Helvetica, Arial, sans-serif`;
  ctx.fillStyle = inkFaint;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const displayAuthor = author.length > 30 ? author.slice(0, 28) + '…' : author;
  ctx.fillText(displayAuthor, 0, 0, maxW);
  ctx.restore();

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

const loader = new THREE.TextureLoader();

export function createBookMesh(book: BookData, index: number): THREE.Mesh {
  const spineColor = book.spineColor ?? SPINE_PALETTE[index % SPINE_PALETTE.length];
  const spineTex = makeSpineTexture(book.title, book.author, spineColor);

  const sideMat = new THREE.MeshStandardMaterial({
    color: spineColor,
    roughness: SPINE_ROUGHNESS,
    metalness: SPINE_METALNESS,
  });

  const spineMat = new THREE.MeshStandardMaterial({
    map: spineTex,
    roughness: SPINE_ROUGHNESS,
    metalness: SPINE_METALNESS,
  });

  const coverMat = new THREE.MeshStandardMaterial({
    color: spineColor,
    roughness: SPINE_ROUGHNESS,
    metalness: SPINE_METALNESS,
  });

  // BoxGeometry material order: +X, -X, +Y, -Y, +Z (spine), -Z (cover)
  const materials = [sideMat, sideMat, sideMat, sideMat, spineMat, coverMat];

  const geo = new THREE.BoxGeometry(SPINE_THICKNESS, CASE_HEIGHT, CASE_DEPTH);
  const mesh = new THREE.Mesh(geo, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData.bookData = book;

  // Load cover texture async
  if (book.coverUrl) {
    loader.load(book.coverUrl, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      coverMat.map = tex;
      coverMat.color.set(0xffffff);
      coverMat.needsUpdate = true;
    });
  }

  return mesh;
}
