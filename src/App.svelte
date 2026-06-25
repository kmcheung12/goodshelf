<script lang="ts">
  import ShelfScene from './components/ShelfScene.svelte';
  import Intro from './components/Intro.svelte';

  let userId = '';
  let entered = false;

  function handleEnter(id: string) {
    userId = id;
    entered = true;
  }
</script>

<ShelfScene />
{#if !entered}
  <Intro onEnter={handleEnter} />
{/if}
