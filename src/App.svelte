<script lang="ts">
  import { onMount } from 'svelte';
  import ShelfScene from './components/ShelfScene.svelte';
  import Intro from './components/Intro.svelte';
  import BookDetail from './components/BookDetail.svelte';
  import { GoodreadsAdapter } from './lib/adapters/goodreads';
  import type { BookData } from './lib/adapters/types';

  let entered = false;
  let loading = false;
  let error = '';
  let userId = '';
  let readBooks: BookData[] = [];
  let toReadBooks: BookData[] = [];
  let currentlyReadingBooks: BookData[] = [];
  let selectedBook: BookData | null = null;

  async function handleEnter(id: string) {
    loading = true;
    error = '';
    history.replaceState(null, '', `/${id}`);
    try {
      const [read, toRead, currentlyReading] = await Promise.all([
        new GoodreadsAdapter(id, 'read').getBooks(),
        new GoodreadsAdapter(id, 'to-read').getBooks(),
        new GoodreadsAdapter(id, 'currently-reading').getBooks(),
      ]);
      readBooks = read;
      toReadBooks = toRead;
      currentlyReadingBooks = currentlyReading;
      userId = id;
      entered = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load shelf';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    const match = window.location.pathname.match(/^\/(\d+)\/?$/);
    if (match) handleEnter(match[1]);
  });
</script>

<ShelfScene
  {readBooks}
  {toReadBooks}
  {currentlyReadingBooks}
  onBookSelect={(book) => selectedBook = book}
  onWallEnter={handleEnter}
  wallLoading={loading}
  currentUserId={userId}
/>

<!-- Intro overlay only shown before first load; wall panel handles subsequent changes -->
{#if !entered}
  <Intro onEnter={handleEnter} />
  {#if loading}
    <div class="loading">Loading shelf…</div>
  {/if}
  {#if error}
    <div class="fetch-error">{error}</div>
  {/if}
{/if}

<BookDetail book={selectedBook} onClose={() => selectedBook = null} />

<style>
  .loading {
    position: fixed;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    color: rgba(244, 241, 234, 0.6);
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 13px;
    z-index: 101;
  }

  .fetch-error {
    position: fixed;
    bottom: 60px;
    left: 50%;
    transform: translateX(-50%);
    color: #ef8585;
    font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 13px;
    z-index: 101;
    text-align: center;
    max-width: 320px;
  }
</style>
