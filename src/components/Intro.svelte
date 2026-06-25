<script lang="ts">
  export let onEnter: (userId: string) => void;

  let userId = '';
  let error = '';

  function submit() {
    const trimmed = userId.trim();
    if (!trimmed) { error = 'Enter your Goodreads user ID'; return; }
    if (!/^\d+$/.test(trimmed)) { error = 'User ID should be numeric (e.g. 88966804)'; return; }
    error = '';
    onEnter(trimmed);
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') submit();
  }
</script>

<div class="overlay">
  <div class="card">
    <p class="eyebrow">MY GOODREADS</p>
    <h1 class="title">The Shelf</h1>
    <p class="desc">
      A walk-in view of your Goodreads library, shelved in the order you added them.
      Enter your user ID to browse your collection.
    </p>

    <div class="field">
      <label for="uid">Goodreads User ID</label>
      <input
        id="uid"
        type="text"
        placeholder="e.g. 88966804"
        bind:value={userId}
        on:keydown={onKey}
        autocomplete="off"
        spellcheck={false}
      />
      {#if error}<p class="error">{error}</p>{/if}
    </div>

    <button class="enter-btn" on:click={submit}>Enter the Shelf</button>

    <p class="hint-text">
      Find your ID at goodreads.com/user/show/<strong>ID</strong>-name
    </p>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(11, 11, 13, 0.78);
    backdrop-filter: blur(2px);
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  }

  .card {
    text-align: center;
    max-width: 420px;
    padding: 0 24px;
    color: #f4f1ea;
  }

  .eyebrow {
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: rgba(244, 241, 234, 0.55);
    margin: 0 0 12px;
  }

  .title {
    font-size: clamp(42px, 8vw, 72px);
    font-weight: 700;
    letter-spacing: -0.02em;
    margin: 0 0 18px;
    line-height: 1;
  }

  .desc {
    font-size: 14px;
    line-height: 1.6;
    color: rgba(244, 241, 234, 0.7);
    margin: 0 0 28px;
  }

  .field {
    margin-bottom: 16px;
    text-align: left;
  }

  .field label {
    display: block;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(244, 241, 234, 0.5);
    margin-bottom: 6px;
  }

  .field input {
    width: 100%;
    padding: 10px 14px;
    background: rgba(244, 241, 234, 0.08);
    border: 1px solid rgba(244, 241, 234, 0.2);
    border-radius: 4px;
    color: #f4f1ea;
    font-size: 15px;
    font-family: inherit;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.2s;
  }

  .field input:focus {
    border-color: rgba(244, 241, 234, 0.55);
  }

  .error {
    font-size: 12px;
    color: #ef8585;
    margin: 6px 0 0;
  }

  .enter-btn {
    width: 100%;
    padding: 13px;
    background: #f4f1ea;
    color: #111;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    letter-spacing: 0.05em;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.2s;
  }

  .enter-btn:hover { opacity: 0.88; }
  .enter-btn:active { opacity: 0.75; }

  .hint-text {
    margin: 14px 0 0;
    font-size: 11px;
    color: rgba(244, 241, 234, 0.35);
  }
</style>
