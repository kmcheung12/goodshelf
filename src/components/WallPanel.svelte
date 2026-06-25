<script lang="ts">
  export let onEnter: (userId: string) => void;
  export let loading = false;
  export let currentUserId = '';

  let input = currentUserId;
  let error = '';

  function submit() {
    const id = input.trim();
    if (!id) { error = 'Enter a user ID'; return; }
    if (!/^\d+$/.test(id)) { error = 'Numeric IDs only (e.g. 88966804)'; return; }
    error = '';
    onEnter(id);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') submit();
  }
</script>

<div class="panel">
  <header>
    <span class="title">THE SHELF</span>
    <span class="subtitle">Goodreads virtual bookshelf</span>
  </header>

  <div class="field">
    <label for="wp-uid">User ID</label>
    <div class="row">
      <input
        id="wp-uid"
        type="text"
        bind:value={input}
        on:keydown={onKey}
        placeholder="e.g. 88966804"
        autocomplete="off"
        spellcheck={false}
        disabled={loading}
      />
      <button on:click={submit} disabled={loading}>
        {loading ? '…' : 'Load'}
      </button>
    </div>
    {#if error}<p class="error">{error}</p>{/if}
  </div>

  {#if currentUserId}
    <p class="current">Currently showing: <strong>{currentUserId}</strong></p>
  {/if}

  <p class="hint">Turn around inside the shelf to return here</p>
</div>

<style>
  .panel {
    width: 380px;
    background: rgba(14, 14, 18, 0.92);
    border: 1px solid rgba(244, 241, 234, 0.12);
    border-radius: 8px;
    padding: 20px 22px 18px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #f4f1ea;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255,255,255,0.04);
    /* vertical centre on the CSS2D anchor point */
    transform: translate(-50%, -50%);
    user-select: none;
  }

  header {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-bottom: 16px;
    border-bottom: 1px solid rgba(244, 241, 234, 0.08);
    padding-bottom: 14px;
  }

  .title {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .subtitle {
    font-size: 11px;
    color: rgba(244, 241, 234, 0.4);
    letter-spacing: 0.03em;
  }

  .field label {
    display: block;
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(244, 241, 234, 0.45);
    margin-bottom: 7px;
  }

  .row {
    display: flex;
    gap: 7px;
  }

  input {
    flex: 1;
    padding: 9px 11px;
    background: rgba(244, 241, 234, 0.07);
    border: 1px solid rgba(244, 241, 234, 0.18);
    border-radius: 5px;
    color: #f4f1ea;
    font-size: 13px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    min-width: 0;
  }

  input:focus { border-color: rgba(244, 241, 234, 0.5); }
  input:disabled { opacity: 0.5; }

  button {
    padding: 9px 16px;
    background: #f4f1ea;
    color: #111;
    border: none;
    border-radius: 5px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    flex-shrink: 0;
    transition: opacity 0.15s;
  }

  button:hover:not(:disabled) { opacity: 0.85; }
  button:disabled { opacity: 0.45; cursor: default; }

  .error {
    font-size: 11px;
    color: #ef8585;
    margin: 6px 0 0;
  }

  .current {
    font-size: 11px;
    color: rgba(244, 241, 234, 0.4);
    margin: 12px 0 0;
  }

  .current strong { color: rgba(244, 241, 234, 0.75); }

  .hint {
    font-size: 10px;
    color: rgba(244, 241, 234, 0.22);
    margin: 10px 0 0;
    letter-spacing: 0.04em;
  }
</style>
