<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { mount } from 'svelte';
  import { initScene, type SceneHandle } from '../lib/three/scene';
  import { wallPanelStore } from '../lib/wallPanelStore';
  import type { BookData } from '../lib/adapters/types';
  import Crosshair from './Crosshair.svelte';
  import WallPanel from './WallPanel.svelte';
  import ShelfLoader from './ShelfLoader.svelte';
  import BookPanel from './BookPanel.svelte';

  export let readBooks: BookData[] = [];
  export let toReadBooks: BookData[] = [];
  export let currentlyReadingBooks: BookData[] = [];
  export let onBookSelect: (book: BookData | null) => void = () => {};
  export let onWallEnter: (userId: string) => void = () => {};
  export let onSceneReady: ((api: { turnToBooks: () => void }) => void) | undefined = undefined;
  export let phase: 'landing' | 'loading' | 'browsing' = 'landing';
  export let currentUserId = '';
  export let error = '';

  let canvas: HTMLCanvasElement;
  let wrapper: HTMLDivElement;
  let handle: SceneHandle | undefined;
  let locked = false;
  let inspecting = false;
  let hoveredBook: BookData | null = null;
  let showPanel = false;

  // Keep store in sync with props so WallPanel stays reactive
  $: wallPanelStore.update(s => ({ ...s, currentUserId, error }));

  // React to phase changes once the scene is ready
  $: if (handle) {
    handle.setLoading(phase === 'loading');
    if (phase === 'browsing') handle.turnToBooks();
  }

  onMount(() => {
    handle = initScene(
      canvas,
      onBookSelect,
      (v) => { inspecting = v; },
      (book) => { hoveredBook = book; },
    );

    wrapper.appendChild(handle.overlayElement);

    mount(WallPanel, {
      target: handle.wallPanelElement,
      props: { onEnter: onWallEnter },
    });

    mount(ShelfLoader, { target: handle.loadingElement });

    // Apply initial phase state (handle may not have existed when $: ran)
    handle.setLoading(phase === 'loading');

    onSceneReady?.({ turnToBooks: () => handle!.turnToBooks() });

    const interval = setInterval(() => { locked = handle!.controls.isLocked; }, 100);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyF' && handle!.controls.isLocked) {
        showPanel = !showPanel;
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      clearInterval(interval);
      document.removeEventListener('keydown', onKeyDown);
    };
  });

  $: if (handle && (readBooks.length > 0 || toReadBooks.length > 0 || currentlyReadingBooks.length > 0)) {
    handle.setBooks(readBooks, toReadBooks, currentlyReadingBooks);
  }

  onDestroy(() => handle?.dispose());
</script>

{#if showPanel}
<BookPanel
  {readBooks}
  {toReadBooks}
  {currentlyReadingBooks}
  {hoveredBook}
  {locked}
  onLookAt={(id) => { handle?.lookAtBook(id); handle?.peekBook(id); }}
  onSelectBook={(book) => { hoveredBook = book; onBookSelect(book); }}
  onInspectBook={(book) => { handle?.inspectBook(book.id); }}
/>
{/if}

<div bind:this={wrapper} style="position:relative;width:100%;height:100vh;overflow:hidden;">
  <canvas bind:this={canvas} style="width:100%;height:100%;display:block;" />

  <!-- Vignette shown during inspect -->
  <div class="veil" class:show={inspecting}></div>

  <Crosshair {locked} />

  {#if hoveredBook && !inspecting}
    <div class="book-tooltip">
      <span class="book-id">#{hoveredBook.id}</span>
      <span class="book-title">{hoveredBook.title}</span>
      <span class="book-meta">
        {hoveredBook.author}{hoveredBook.year ? ` · ${hoveredBook.year}` : ''}
      </span>
    </div>
  {/if}

  {#if inspecting}
    <div class="hint">Click anywhere to put it back · Move mouse to rotate</div>
  {:else if !locked}
    {#if phase === 'browsing'}
      <div class="hint">Click to look around · Scroll to zoom · WASD to move · Turn around to search</div>
    {:else}
      <div class="hint">Click to look around</div>
    {/if}
  {/if}
</div>

<style>
  .veil {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(
      125% 105% at 50% 46%,
      rgba(0, 0, 0, 0) 32%,
      rgba(0, 0, 0, 0.62) 100%
    );
    opacity: 0;
    transition: opacity 0.45s;
  }
  .veil.show { opacity: 1; }

  .hint {
    position: absolute;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.45);
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 13px;
    pointer-events: none;
    letter-spacing: 0.04em;
    white-space: nowrap;
  }

  .book-tooltip {
    position: absolute;
    bottom: 28px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    background: rgba(10, 10, 14, 0.82);
    border: 1px solid rgba(255, 255, 255, 0.10);
    border-radius: 8px;
    padding: 10px 18px 11px;
    pointer-events: none;
    white-space: nowrap;
    backdrop-filter: blur(6px);
  }

  .book-id {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.12em;
    color: rgba(255, 255, 255, 0.38);
    text-transform: uppercase;
    margin-bottom: 1px;
  }

  .book-title {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 17px;
    font-weight: 700;
    color: #f4f1ea;
    letter-spacing: 0.01em;
  }

  .book-meta {
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 12px;
    color: rgba(244, 241, 234, 0.5);
    letter-spacing: 0.03em;
  }
</style>
