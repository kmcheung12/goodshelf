<div class="overlay">
  <div class="scene">
    <div class="book">
      <div class="face front">
        <div class="inner-border"></div>
        <div class="lines"></div>
      </div>
      <div class="face back"></div>
      <div class="face spine"></div>
      <div class="face fore"></div>
      <div class="face top"></div>
      <div class="face btm"></div>
    </div>
  </div>
  <p class="label">Loading shelf…</p>
</div>

<style>
  /* ── layout ─────────────────────────────────────────────────────── */
  .overlay {
    position: fixed;
    inset: 0;
    background: #0b0b0d;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 300;
  }

  .scene {
    perspective: 700px;
    margin-bottom: 48px;
  }

  /* ── book container ──────────────────────────────────────────────── */
  .book {
    --cw: 96px;   /* cover width  */
    --ch: 140px;  /* cover height */
    --ct: 24px;   /* thickness    */

    width: var(--cw);
    height: var(--ch);
    position: relative;
    transform-style: preserve-3d;
    animation: spin 5s linear infinite;
  }

  @keyframes spin {
    from { transform: rotateX(-14deg) rotateY(0deg); }
    to   { transform: rotateX(-14deg) rotateY(360deg); }
  }

  /* ── shared face defaults ────────────────────────────────────────── */
  .face {
    position: absolute;
    top: 0;
    left: 0;
    backface-visibility: hidden;
  }

  /* ── front cover ─────────────────────────────────────────────────── */
  .front {
    width: var(--cw);
    height: var(--ch);
    background: #1a1e30;
    transform: translateZ(calc(var(--ct) / 2));
    overflow: hidden;
  }

  .inner-border {
    position: absolute;
    inset: 9px;
    border: 1px solid rgba(255, 255, 255, 0.18);
  }

  .lines {
    position: absolute;
    top: 22px;
    left: 16px;
    right: 16px;
    height: 2px;
    background: rgba(255, 255, 255, 0.28);
    box-shadow:
      0 7px 0 rgba(255, 255, 255, 0.14),
      0 13px 0 rgba(255, 255, 255, 0.08);
  }

  /* ── back cover ──────────────────────────────────────────────────── */
  .back {
    width: var(--cw);
    height: var(--ch);
    background: #12151f;
    transform: rotateY(180deg) translateZ(calc(var(--ct) / 2));
  }

  /* ── spine (left wall) ───────────────────────────────────────────── */
  .spine {
    width: var(--ct);
    height: var(--ch);
    margin-left: calc(-1 * var(--ct));
    background: #0e1018;
    transform-origin: right center;
    transform: rotateY(-90deg);
  }

  /* ── fore-edge / pages (right wall) ─────────────────────────────── */
  .fore {
    width: var(--ct);
    height: var(--ch);
    left: auto;
    right: 0;
    margin-right: calc(-1 * var(--ct));
    background: #ddd8cc;
    transform-origin: left center;
    transform: rotateY(90deg);
  }

  /* ── top ─────────────────────────────────────────────────────────── */
  .top {
    width: var(--cw);
    height: var(--ct);
    margin-top: calc(-1 * var(--ct));
    background: #d8d3c7;
    transform-origin: center bottom;
    transform: rotateX(-90deg);
  }

  /* ── bottom ──────────────────────────────────────────────────────── */
  .btm {
    width: var(--cw);
    height: var(--ct);
    top: auto;
    bottom: 0;
    margin-bottom: calc(-1 * var(--ct));
    background: #ccc8bc;
    transform-origin: center top;
    transform: rotateX(90deg);
  }

  /* ── label ───────────────────────────────────────────────────────── */
  .label {
    color: rgba(244, 241, 234, 0.35);
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 12px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin: 0;
  }
</style>
