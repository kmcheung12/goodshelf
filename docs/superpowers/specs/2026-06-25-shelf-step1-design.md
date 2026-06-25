# Shelf Step 1 — 3D Virtual Bookshelf Scene

**Date:** 2026-06-25  
**Stack:** Vite + Svelte + Three.js  
**Scope:** Shelf scene only, with a MockAdapter. No real data source this session.

---

## Goal

Replicate the visual and interactive feel of the-criterion-closet.vercel.app but for books, using a pluggable adapter interface so any data source can populate the shelf.

---

## Data Contract

The adapter interface is the seam between the shelf scene and any data source:

```ts
// src/lib/adapters/types.ts

export type BookData = {
  id: string
  title: string
  author: string
  coverUrl?: string     // URL to cover image; spine texture fallback if absent
  spineColor?: string   // hex color for spine background; random pastel if absent
  dateAdded?: Date
  shelf?: 'read' | 'to-read' | 'currently-reading'
}

export interface IBookAdapter {
  getBooks(): Promise<BookData[]>
}
```

This session: `MockAdapter` implements `IBookAdapter` and returns ~20 hardcoded placeholder books with varied spine colors and titles.

---

## Three.js Scene

### Camera & Controls
- `PerspectiveCamera`, FOV 60°, positioned ~3m in front of the shelf
- Mouse-drag (left button) pans the camera horizontally along the shelf
- Scroll wheel zooms in/out (clamped)
- No orbit — camera stays at shelf eye level, translates X only

### Lighting
- Ambient light (warm, low intensity) for base illumination
- Two point lights at ceiling positions casting soft shadows
- `PCFSoftShadowMap` for shadow quality

### Shelf Geometry (`ShelfMesh.ts`)
- 3–4 rows of shelves, each a `BoxGeometry` plank
- Dark wood texture (MeshStandardMaterial with roughness)
- Back wall: dark matte panel
- Floor: subtle reflection

### Book Meshes (`BookMesh.ts`)
- Each book: `BoxGeometry` sized proportionally (width varies by title length, ~25–40mm wide, 220mm tall, 140mm deep)
- Materials: 6 faces — front (spine) uses canvas texture; back uses cover image if `coverUrl` present, else `spineColor`; top/bottom/left/right use `spineColor`
- Spine texture: canvas 256×512, background `spineColor`, title + author rendered as rotated text
- Cover texture: if `coverUrl` present, loaded async via `TextureLoader` and applied to the back face
- Books placed sequentially on shelf rows, left to right, wrapping to next row

### Interactions (Raycasting in `scene.ts`)
- Each frame: raycast from camera through mouse position
- **Hover:** intersected book tilts forward ~15° on Z axis (smooth lerp), cursor changes to pointer
- **Click:** 
  - Book animates out (translate forward ~100mm, slight Y rise)
  - Camera dollies toward book
  - `BookDetail` overlay appears with book metadata
  - Click elsewhere or press Escape to dismiss

### Crosshair
- Fixed HTML `<div>` overlay, centered, `pointer-events: none`
- Small `+` mark, white, 60% opacity

---

## Components

### `ShelfScene.svelte`
- Mounts a `<canvas>` element
- On mount: initializes `scene.ts`, passes `BookData[]` from adapter
- On destroy: disposes Three.js resources
- Emits `bookSelected` event upward on click

### `BookDetail.svelte`
- Absolute-positioned overlay (bottom-right or center)
- Shows: cover image (if available), title, author, shelf status, date added
- Close button + Escape key handler

### `Controls.svelte`
- Floating menu, toggled by `F` key or a small gear icon
- Options: sort by title / author / date added
- Filter by shelf: All / Read / To-read / Currently reading
- Communicates via a Svelte writable store

### `App.svelte`
- Instantiates `MockAdapter`, fetches books, passes to `ShelfScene`
- Composes `ShelfScene`, `BookDetail`, `Controls`

---

## Stores

```ts
// src/lib/stores/books.ts
export const books = writable<BookData[]>([])
export const selectedBook = writable<BookData | null>(null)
export const sortBy = writable<'title' | 'author' | 'dateAdded'>('dateAdded')
export const filterShelf = writable<string>('all')
```

---

## File Structure

```
shelf/
├── src/
│   ├── lib/
│   │   ├── adapters/
│   │   │   ├── types.ts
│   │   │   └── mock.ts
│   │   ├── three/
│   │   │   ├── BookMesh.ts
│   │   │   ├── ShelfMesh.ts
│   │   │   └── scene.ts
│   │   └── stores/
│   │       └── books.ts
│   ├── components/
│   │   ├── ShelfScene.svelte
│   │   ├── BookDetail.svelte
│   │   └── Controls.svelte
│   └── App.svelte
├── docs/
│   └── superpowers/specs/
│       └── 2026-06-25-shelf-step1-design.md
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## Out of Scope (Step 1)

- Goodreads RSS fetching
- Node proxy backend on Hetzner
- Authentication or user ID input
- Mobile/touch support
- Keyboard shortcut `R` (random book) — nice to have, add if time permits
