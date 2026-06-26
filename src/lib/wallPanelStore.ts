import { writable } from 'svelte/store';

export const wallPanelStore = writable({
  currentUserId: '',
  error: '',
});
