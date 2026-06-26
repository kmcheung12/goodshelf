<script lang="ts">
  import { onMount } from 'svelte';
  import ShelfScene from './components/ShelfScene.svelte';
  import BookDetail from './components/BookDetail.svelte';
  import { GoodreadsAdapter } from './lib/adapters/goodreads';
  import type { BookData } from './lib/adapters/types';

  type Phase = 'landing' | 'loading' | 'browsing';

  let phase: Phase = 'landing';
  let error = '';
  let userId = '';
  let sceneApi: { turnToBooks: () => void } | undefined;
  let readBooks: BookData[] = [];
  let toReadBooks: BookData[] = [];
  let currentlyReadingBooks: BookData[] = [];
  let selectedBook: BookData | null = null;

  const isExtension = import.meta.env.VITE_IS_EXTENSION === 'true';
  const base = import.meta.env.BASE_URL;

  async function handleEnter(id: string) {
    if (id === userId && phase === 'browsing') {
      sceneApi?.turnToBooks();
      return;
    }
    phase = 'loading';
    error = '';
    history.replaceState(null, '', isExtension ? `#${id}` : `${base}${id}`);
    try {
      const [read, toRead, currentlyReading] = await Promise.all([
        new GoodreadsAdapter(id, 'read').getBooks(),
        new GoodreadsAdapter(id, 'to-read').getBooks(),
        new GoodreadsAdapter(id, 'currently-reading').getBooks(),
      ]);
      console.log(`[shelf] read=${read.length} to-read=${toRead.length} currently-reading=${currentlyReading.length}`);
      readBooks = read;
      toReadBooks = toRead;
      currentlyReadingBooks = currentlyReading;
      userId = id;
      phase = 'browsing';
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to load shelf';
      phase = 'landing';
    }
  }

  onMount(() => {
    if (isExtension) {
      const hash = window.location.hash.replace(/^#/, '');
      if (/^\d+$/.test(hash)) handleEnter(hash);
    } else {
      const path = '/' + window.location.pathname.slice(base.length);
      const match = path.match(/^\/(\d+)\/?$/);
      if (match) handleEnter(match[1]);
    }
  });
</script>

<ShelfScene
  {readBooks}
  {toReadBooks}
  {currentlyReadingBooks}
  onBookSelect={(book) => selectedBook = book}
  onWallEnter={handleEnter}
  onSceneReady={(api) => { sceneApi = api; }}
  {phase}
  currentUserId={userId}
  {error}
/>

<BookDetail book={selectedBook} onClose={() => selectedBook = null} />
