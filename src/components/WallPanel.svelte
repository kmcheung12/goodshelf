<script lang="ts">
  import { wallPanelStore } from '../lib/wallPanelStore';

  export let onEnter: (userId: string) => void;

  let input = '';
  let localError = '';
  let autoFilled = false;

  // Pre-fill once when a userId first arrives (direct URL load). After that, the
  // user owns the field — a reactive statement would re-fill on every clear.
  $: if ($wallPanelStore.currentUserId && !autoFilled) {
    input = $wallPanelStore.currentUserId;
    autoFilled = true;
  }

  function submit() {
    const id = input.trim();
    if (!id) { localError = 'Enter your Goodreads user ID'; return; }
    if (!/^\d+$/.test(id)) { localError = 'User ID should be numeric (e.g. 88966804)'; return; }
    localError = '';
    onEnter(id);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') submit();
  }

  $: displayError = localError || $wallPanelStore.error;

  const isMobile = typeof window !== 'undefined' && 'ontouchstart' in window;
</script>

<div class="card">
  <h1 class="title">Good Shelves</h1>
  <p class="desc">
    A walk-in view of your Goodreads library.
  </p>

  <div class="field">
    <label for="wp-uid">Goodreads User ID</label>
    <input
      id="wp-uid"
      type="text"
      bind:value={input}
      on:keydown={onKey}
      placeholder="e.g. 88966804"
      autocomplete="off"
      spellcheck={false}
    />
    {#if displayError}<p class="error">{displayError}</p>{/if}
  </div>

  <button class="enter-btn" on:click={submit}>Load Up Your Shelf</button>

  {#if $wallPanelStore.currentUserId}
    <p class="current">Currently: <strong>{$wallPanelStore.currentUserId}</strong></p>
  {/if}

  <p class="hint">
    Find your ID at goodreads.com/user/show/<strong>ID</strong>-name
  </p>
</div>

{#if !isMobile}
<p class="controls-hint">
  <strong>mouse</strong> or <strong>WASD</strong> to look around &nbsp;·&nbsp;
  <strong>F</strong> to toggle shelf list &nbsp;·&nbsp;
  <strong>scroll</strong> to zoom
</p>
{/if}

<style>
  .card {
    width: 480px;
    background: rgba(11, 11, 13, 0.93);
    border: 1px solid rgba(244, 241, 234, 0.10);
    border-radius: 10px;
    padding: 36px 36px 28px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #f4f1ea;
    box-shadow: 0 16px 48px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255,255,255,0.04);
    backdrop-filter: blur(4px);
  }

  .title {
    font-size: 48px;
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 14px;
    line-height: 1;
  }

  .desc {
    font-size: 14px;
    line-height: 1.55;
    color: rgba(244, 241, 234, 0.65);
    margin: 0 0 26px;
  }

  .field label {
    display: block;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(244, 241, 234, 0.55);
    margin-bottom: 8px;
  }

  input {
    width: 100%;
    padding: 12px 14px;
    background: rgba(244, 241, 234, 0.07);
    border: 1px solid rgba(244, 241, 234, 0.18);
    border-radius: 5px;
    color: #f4f1ea;
    font-size: 15px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  input:focus { border-color: rgba(244, 241, 234, 0.5); }

  .error {
    font-size: 12px;
    color: #ef8585;
    margin: 6px 0 0;
  }

  .enter-btn {
    width: 100%;
    margin-top: 16px;
    padding: 14px;
    background: #f4f1ea;
    color: #111;
    border: none;
    border-radius: 5px;
    font-size: 15px;
    font-weight: 600;
    letter-spacing: 0.04em;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.15s;
  }

  .enter-btn:hover { opacity: 0.88; }
  .enter-btn:active { opacity: 0.72; }

  .current {
    font-size: 12px;
    color: rgba(244, 241, 234, 0.45);
    margin: 14px 0 0;
    text-align: center;
  }

  .current strong { color: rgba(244, 241, 234, 0.75); }

  .hint {
    font-size: 11px;
    color: rgba(244, 241, 234, 0.40);
    margin: 12px 0 0;
    letter-spacing: 0.03em;
  }

  .controls-hint {
    margin-top: 16px;
    font-size: 12px;
    color: rgba(244, 241, 234, 0.55);
    text-align: center;
    letter-spacing: 0.02em;
    line-height: 1.6;
  }

  .controls-hint strong {
    color: rgba(244, 241, 234, 0.90);
    font-weight: 600;
  }
</style>
