<script lang="ts">
  import { afterUpdate, onMount, onDestroy } from 'svelte';
  import type { BookData } from '../lib/adapters/types';

  export let readBooks: BookData[] = [];
  export let toReadBooks: BookData[] = [];
  export let currentlyReadingBooks: BookData[] = [];
  export let hoveredBook: BookData | null = null;
  export let locked = false;
  export let onLookAt: (bookId: string) => void = () => {};
  export let onSelectBook: (book: BookData) => void = () => {};
  export let onInspectBook: (book: BookData) => void = () => {};

  type ShelfKey = 'to-read' | 'read' | 'reading';

  const LABELS: Record<ShelfKey, string> = {
    'to-read': 'To-Read',
    'read': 'Read',
    'reading': 'Reading',
  };

  let activeShelf: ShelfKey = 'read';
  let selectedIndex = -1;
  let listEl: HTMLOListElement;

  $: toReadSet  = new Set(toReadBooks.map(b => b.id));
  $: readSet    = new Set(readBooks.map(b => b.id));
  $: readingSet = new Set(currentlyReadingBooks.map(b => b.id));

  $: activeBooks =
    activeShelf === 'to-read' ? toReadBooks :
    activeShelf === 'read'    ? readBooks    :
    currentlyReadingBooks;

  // When 3D hover changes: switch shelf + sync selectedIndex
  $: if (hoveredBook) {
    if (toReadSet.has(hoveredBook.id)) {
      activeShelf = 'to-read';
    } else if (readSet.has(hoveredBook.id)) {
      activeShelf = 'read';
    } else if (readingSet.has(hoveredBook.id)) {
      activeShelf = 'reading';
    }
  }

  $: if (hoveredBook && activeBooks) {
    const idx = activeBooks.findIndex(b => b.id === hoveredBook!.id);
    if (idx !== -1) selectedIndex = idx;
  }

  // Auto-scroll highlighted item into view
  afterUpdate(() => {
    if (selectedIndex >= 0 && listEl) {
      const el = listEl.querySelector<HTMLElement>(`[data-idx="${selectedIndex}"]`);
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  });

  // Hover: peek + sidebar update
  function hover(book: BookData, index: number) {
    selectedIndex = index;
    onLookAt(book.id);
    onSelectBook(book);
  }

  // Click: full fly-out inspect
  function click(book: BookData, index: number) {
    selectedIndex = index;
    onInspectBook(book);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (locked) return;
    if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
    if (activeBooks.length === 0) return;
    e.preventDefault();
    const next = e.key === 'ArrowDown'
      ? Math.min(selectedIndex + 1, activeBooks.length - 1)
      : Math.max(selectedIndex - 1, 0);
    if (next === selectedIndex) return;
    hover(activeBooks[next], next);
  }

  onMount(() => document.addEventListener('keydown', onKeyDown));
  onDestroy(() => document.removeEventListener('keydown', onKeyDown));

  function counts(): Record<ShelfKey, number> {
    return {
      'to-read': toReadBooks.length,
      'read': readBooks.length,
      'reading': currentlyReadingBooks.length,
    };
  }
</script>

<aside class="panel">
  <!-- master: shelf tabs -->
  <nav class="tabs">
    {#each Object.entries(LABELS) as [key, label]}
      {@const k = key as ShelfKey}
      <button
        class="tab"
        class:active={activeShelf === k}
        on:click={() => { activeShelf = k; selectedIndex = -1; }}
      >
        <span class="tab-label">{label}</span>
        <span class="tab-count">{counts()[k]}</span>
      </button>
    {/each}
  </nav>

  <!-- detail: book list -->
  <ol class="books" bind:this={listEl}>
    {#each activeBooks as book, i}
      <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
      <li
        class="book-item"
        class:highlighted={selectedIndex === i}
        data-idx={i}
        on:mouseenter={() => { if (!locked) hover(book, i); }}
        on:click={() => click(book, i)}
      >
        <span class="num">{i + 1}</span>
        <span class="name">{book.title}</span>
      </li>
    {/each}
  </ol>
</aside>

<style>
  .panel {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: 25vw;
    min-width: 200px;
    max-width: 360px;
    display: flex;
    flex-direction: column;
    background: rgba(10, 10, 14, 0.88);
    border-right: 1px solid rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(8px);
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    z-index: 50;
    pointer-events: auto;
  }

  /* ── shelf tabs ─────────────────────────────────────────── */
  .tabs {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  .tab {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 11px 14px;
    background: none;
    border: none;
    border-left: 2px solid transparent;
    color: rgba(244, 241, 234, 0.38);
    font-family: inherit;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.10em;
    text-transform: uppercase;
    cursor: pointer;
    text-align: left;
    transition: color 0.15s, border-color 0.15s, background 0.15s;
  }

  .tab:hover {
    color: rgba(244, 241, 234, 0.75);
    background: rgba(255, 255, 255, 0.04);
  }

  .tab.active {
    color: #f4f1ea;
    border-left-color: #f4f1ea;
    background: rgba(255, 255, 255, 0.05);
  }

  .tab-count {
    font-size: 10px;
    font-weight: 400;
    color: rgba(244, 241, 234, 0.28);
    letter-spacing: 0;
  }

  .tab.active .tab-count { color: rgba(244, 241, 234, 0.55); }

  /* ── book list ──────────────────────────────────────────── */
  .books {
    flex: 1;
    overflow-y: auto;
    margin: 0;
    padding: 6px 0;
    list-style: none;
    scrollbar-width: thin;
    scrollbar-color: rgba(255,255,255,0.12) transparent;
  }

  .book-item {
    display: flex;
    align-items: baseline;
    gap: 8px;
    padding: 5px 14px;
    cursor: pointer;
    transition: background 0.1s;
  }

  .book-item:hover { background: rgba(255, 255, 255, 0.07); }

  .book-item.highlighted {
    background: rgba(255, 255, 255, 0.11);
  }

  .num {
    flex-shrink: 0;
    font-size: 10px;
    color: rgba(244, 241, 234, 0.25);
    width: 28px;
    text-align: right;
  }

  .book-item.highlighted .num { color: rgba(244, 241, 234, 0.5); }

  .name {
    font-size: 12px;
    color: rgba(244, 241, 234, 0.65);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.4;
  }

  .book-item:hover .name,
  .book-item.highlighted .name { color: #f4f1ea; }
</style>
