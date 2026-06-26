<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import type { BookData } from '../lib/adapters/types';

  export let book: BookData | null = null;
  export let onClose: () => void;

  function formatDate(d: Date | undefined): string {
    if (!d) return '—';
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function shelfLabel(s: string | undefined): string {
    if (s === 'read') return 'Read';
    if (s === 'to-read') return 'Want to read';
    if (s === 'currently-reading') return 'Currently reading';
    return '—';
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }

  onMount(() => document.addEventListener('keydown', onKey));
  onDestroy(() => document.removeEventListener('keydown', onKey));
</script>

{#if book}
  <div class="panel" role="dialog" aria-modal="true" aria-label="Book detail">
    <button class="close" on:click={onClose} aria-label="Close">✕</button>

    <div class="cover-wrap">
      {#if book.coverUrl}
        <img class="cover" src={book.coverUrl} alt="Cover of {book.title}" />
      {:else}
        <div class="cover-placeholder"></div>
      {/if}
    </div>

    <div class="meta">
      <h2 class="book-title">{book.title}</h2>
      <p class="book-author">{book.author}</p>

      <dl class="details">
        <dt>Shelf</dt>
        <dd>{shelfLabel(book.shelf)}</dd>

        <dt>Added</dt>
        <dd>{formatDate(book.dateAdded)}</dd>

        <dt>Goodreads</dt>
        <dd>
          <a
            class="gr-link"
            href="https://www.goodreads.com/book/show/{book.id}"
            target="_blank"
            rel="noopener noreferrer"
          >View page ↗</a>
        </dd>
      </dl>
    </div>
  </div>
{/if}

<style>
  .panel {
    position: fixed;
    right: 0;
    top: 0;
    bottom: 0;
    width: 300px;
    background: rgba(11, 11, 13, 0.94);
    backdrop-filter: blur(8px);
    border-left: 1px solid rgba(244, 241, 234, 0.1);
    padding: 24px 20px;
    z-index: 50;
    display: flex;
    flex-direction: column;
    gap: 20px;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    color: #f4f1ea;
    overflow-y: auto;
  }

  .close {
    align-self: flex-end;
    background: none;
    border: none;
    color: rgba(244, 241, 234, 0.5);
    font-size: 18px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }
  .close:hover { color: #f4f1ea; }

  .cover-wrap {
    display: flex;
    justify-content: center;
  }

  .cover {
    max-width: 160px;
    max-height: 240px;
    object-fit: contain;
    border-radius: 3px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.6);
  }

  .cover-placeholder {
    width: 120px;
    height: 180px;
    background: rgba(244, 241, 234, 0.08);
    border-radius: 3px;
  }

  .book-title {
    font-size: 17px;
    font-weight: 700;
    margin: 0 0 6px;
    line-height: 1.3;
  }

  .book-author {
    font-size: 13px;
    color: rgba(244, 241, 234, 0.6);
    margin: 0 0 16px;
  }

  .details {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 6px 14px;
    font-size: 12px;
    margin: 0;
  }

  dt {
    color: rgba(244, 241, 234, 0.45);
    text-transform: uppercase;
    letter-spacing: 0.08em;
    font-size: 10px;
    align-self: center;
  }

  dd {
    margin: 0;
    color: rgba(244, 241, 234, 0.85);
  }

  .gr-link {
    color: rgba(244, 241, 234, 0.65);
    text-decoration: none;
    transition: color 0.15s;
  }
  .gr-link:hover { color: #f4f1ea; }
</style>
