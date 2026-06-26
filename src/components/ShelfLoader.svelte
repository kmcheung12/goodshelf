<div class="loader">
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
  .loader {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 8px 0 0;
  }

  .scene {
    perspective: 700px;
    margin-bottom: 18px;
  }

  .book {
    --cw: 80px;
    --ch: 116px;
    --ct: 20px;

    width: var(--cw);
    height: var(--ch);
    position: relative;
    transform-style: preserve-3d;
    animation: spin 4s linear infinite;
  }

  @keyframes spin {
    from { transform: rotateX(-14deg) rotateY(0deg); }
    to   { transform: rotateX(-14deg) rotateY(360deg); }
  }

  .face {
    position: absolute;
    top: 0;
    left: 0;
    backface-visibility: hidden;
  }

  .front {
    width: var(--cw);
    height: var(--ch);
    background: #1a1e30;
    transform: translateZ(calc(var(--ct) / 2));
    overflow: hidden;
  }

  .inner-border {
    position: absolute;
    inset: 7px;
    border: 1px solid rgba(255, 255, 255, 0.18);
  }

  .lines {
    position: absolute;
    top: 18px;
    left: 13px;
    right: 13px;
    height: 2px;
    background: rgba(255, 255, 255, 0.28);
    box-shadow:
      0 6px 0 rgba(255, 255, 255, 0.14),
      0 11px 0 rgba(255, 255, 255, 0.08);
  }

  .back {
    width: var(--cw);
    height: var(--ch);
    background: #12151f;
    transform: rotateY(180deg) translateZ(calc(var(--ct) / 2));
  }

  .spine {
    width: var(--ct);
    height: var(--ch);
    margin-left: calc(-1 * var(--ct));
    background: #0e1018;
    transform-origin: right center;
    transform: rotateY(-90deg);
  }

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

  .top {
    width: var(--cw);
    height: var(--ct);
    margin-top: calc(-1 * var(--ct));
    background: #d8d3c7;
    transform-origin: center bottom;
    transform: rotateX(-90deg);
  }

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

  .label {
    color: rgba(244, 241, 234, 0.45);
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    margin: 0;
  }
</style>
