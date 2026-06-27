import type { IBookAdapter, BookData } from './types';
import { parseGoodreadsRSS } from './rss-parser';

const PROXY_URL    = import.meta.env.VITE_PROXY_URL ?? '';
const IS_EXTENSION = import.meta.env.VITE_IS_EXTENSION === 'true';
const PER_PAGE     = 200; // Goodreads RSS hard cap
const MAX_PAGES    = 10;  // safety ceiling (2 000 books)

function sendRssMessage(msg: object): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(msg, (response: { ok: boolean; xml?: string; error?: string }) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (response?.ok && response.xml) {
        resolve(response.xml);
      } else {
        reject(new Error(response?.error ?? 'Unknown error'));
      }
    });
  });
}

export class GoodreadsAdapter implements IBookAdapter {
  constructor(
    private readonly userId: string,
    private readonly shelf?: string,
  ) {}

  private async fetchPage(page: number): Promise<string> {
    if (IS_EXTENSION) {
      // Route through the extension service worker — it has host_permissions
      // and makes the actual fetch without CORS restrictions.
      return sendRssMessage({
        type: 'rss',
        userId: this.userId,
        shelf: this.shelf,
        perPage: PER_PAGE,
        page,
      });
    }

    const shelfPart = this.shelf ? `&shelf=${encodeURIComponent(this.shelf)}` : '';
    const pagePart  = page > 1 ? `&page=${page}` : '';

    const proxyUrl = `${PROXY_URL}/rss?userId=${this.userId}${shelfPart}&per_page=${PER_PAGE}${pagePart}`;
    const res = await fetch(proxyUrl);
    if (!res.ok) throw new Error(`Proxy error: HTTP ${res.status}`);
    return res.text();
  }

  async getBooks(): Promise<BookData[]> {
    const all: BookData[] = [];
    for (let page = 1; page <= MAX_PAGES; page++) {
      const xml   = await this.fetchPage(page);
      const books = parseGoodreadsRSS(xml);
      all.push(...books);
      if (books.length < PER_PAGE) break;
    }
    return all;
  }
}
