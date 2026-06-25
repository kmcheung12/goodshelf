<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { initScene, type SceneHandle } from '../lib/three/scene';
  import type { BookData } from '../lib/adapters/types';
  import Crosshair from './Crosshair.svelte';

  export let readBooks: BookData[] = [];
  export let toReadBooks: BookData[] = [];
  export let currentlyReadingBooks: BookData[] = [];
  export let onBookSelect: (book: BookData | null) => void = () => {};

  let canvas: HTMLCanvasElement;
  let handle: SceneHandle;
  let locked = false;

  onMount(() => {
    handle = initScene(canvas, onBookSelect);
    const interval = setInterval(() => { locked = handle.controls.isLocked; }, 100);
    return () => clearInterval(interval);
  });

  // Push books into the scene once any shelf arrives
  $: if (handle && (readBooks.length > 0 || toReadBooks.length > 0 || currentlyReadingBooks.length > 0)) {
    handle.setBooks(readBooks, toReadBooks, currentlyReadingBooks);
  }

  onDestroy(() => handle?.dispose());
</script>

<canvas bind:this={canvas} style="width:100%;height:100vh;display:block;" />
<Crosshair {locked} />

{#if !locked}
  <div class="hint">Click to look around · Scroll to zoom · WASD to move</div>
{/if}

<style>
  .hint {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(255, 255, 255, 0.45);
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 13px;
    pointer-events: none;
    letter-spacing: 0.04em;
  }
</style>
