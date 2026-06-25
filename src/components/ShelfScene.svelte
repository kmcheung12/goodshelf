<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { mount } from 'svelte';
  import { initScene, type SceneHandle } from '../lib/three/scene';
  import type { BookData } from '../lib/adapters/types';
  import Crosshair from './Crosshair.svelte';
  import WallPanel from './WallPanel.svelte';

  export let readBooks: BookData[] = [];
  export let toReadBooks: BookData[] = [];
  export let currentlyReadingBooks: BookData[] = [];
  export let onBookSelect: (book: BookData | null) => void = () => {};
  export let onWallEnter: (userId: string) => void = () => {};
  export let wallLoading = false;
  export let currentUserId = '';

  let canvas: HTMLCanvasElement;
  let wrapper: HTMLDivElement;
  let handle: SceneHandle;
  let locked = false;
  let inspecting = false;

  onMount(() => {
    handle = initScene(
      canvas,
      onBookSelect,
      (v) => { inspecting = v; },
    );

    wrapper.appendChild(handle.overlayElement);

    mount(WallPanel, {
      target: handle.wallPanelElement,
      props: { onEnter: onWallEnter, loading: wallLoading, currentUserId },
    });

    const interval = setInterval(() => { locked = handle.controls.isLocked; }, 100);
    return () => clearInterval(interval);
  });

  $: if (handle && (readBooks.length > 0 || toReadBooks.length > 0 || currentlyReadingBooks.length > 0)) {
    handle.setBooks(readBooks, toReadBooks, currentlyReadingBooks);
  }

  onDestroy(() => handle?.dispose());
</script>

<div bind:this={wrapper} style="position:relative;width:100%;height:100vh;overflow:hidden;">
  <canvas bind:this={canvas} style="width:100%;height:100%;display:block;" />

  <!-- Vignette shown during inspect -->
  <div class="veil" class:show={inspecting} />

  <Crosshair {locked} />

  {#if inspecting}
    <div class="hint">Click anywhere to put it back · Move mouse to rotate</div>
  {:else if !locked}
    <div class="hint">Click to look around · Scroll to zoom · WASD to move · Turn around for controls</div>
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
</style>
