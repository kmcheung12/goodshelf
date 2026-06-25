<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { initScene, type SceneHandle } from '../lib/three/scene';
  import Crosshair from './Crosshair.svelte';

  let canvas: HTMLCanvasElement;
  let handle: SceneHandle;
  let locked = false;

  onMount(() => {
    handle = initScene(canvas);
    // Poll pointer lock state for crosshair
    const interval = setInterval(() => {
      locked = handle.controls.isLocked;
    }, 100);
    return () => clearInterval(interval);
  });

  onDestroy(() => handle?.dispose());
</script>

<canvas bind:this={canvas} style="width:100%;height:100vh;display:block;" />
<Crosshair {locked} />

<!-- Click-to-enter hint shown when not locked -->
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
