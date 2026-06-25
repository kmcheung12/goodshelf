<script lang="ts">
  import ShelfScene from './components/ShelfScene.svelte';
  import Intro from './components/Intro.svelte';
  import BookDetail from './components/BookDetail.svelte';
  import { GoodreadsAdapter } from './lib/adapters/goodreads';
  import type { BookData } from './lib/adapters/types';

  let entered = false;
  let loading = false;
  let error = '';
  let readBooks: BookData[] = [];
  let toReadBooks: BookData[] = [];
  let currentlyReadingBooks: BookData[] = [];
  let selectedBook: BookData | null = null;

  async function handleEnter(userId: string) {
    loading = true;
    error = '';
    try {
      const [read, toRead, currentlyReading] = await Promise.all([
        new GoodreadsAdapter(userId, 'read').getBooks(),
        new GoodreadsAdapter(userId, 'to-read').getBooks(),
        new GoodreadsAdapter(userId, 'currently-reading').getBooks(),
      ]);
      readBooks = read;
      toReadBooks = toRead;
      currentlyReadingBooks = currentlyReading;
      entered = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load shelf';
    } finally {
      loading = false;
    }
  }
</script>

<ShelfScene
  {readBooks}
  {toReadBooks}
  {currentlyReadingBooks}
  onBookSelect={(book) => selectedBook = book}
/>

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
