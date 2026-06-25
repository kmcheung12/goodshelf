<script lang="ts">
  export let locked = false;
</script>

<div id="crosshair" class:locked></div>

<style>
  #crosshair {
    position: fixed;
    left: 50%; top: 50%;
    width: 18px; height: 18px;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 20;
    opacity: 0;
    transition: opacity 0.25s;
  }
  #crosshair.locked { opacity: 0.55; }
  #crosshair::before, #crosshair::after {
    content: '';
    position: absolute;
    background: rgba(255, 255, 255, 0.85);
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.7);
  }
  #crosshair::before {
    left: 50%; top: 0;
    width: 2px; height: 100%;
    transform: translateX(-50%);
  }
  #crosshair::after {
    top: 50%; left: 0;
    height: 2px; width: 100%;
    transform: translateY(-50%);
  }
</style>
