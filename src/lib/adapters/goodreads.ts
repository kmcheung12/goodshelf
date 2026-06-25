import type { IBookAdapter, BookData } from './types';
import { parseGoodreadsRSS } from './rss-parser';

const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? 'http://localhost:3001';

export class GoodreadsAdapter implements IBookAdapter {
  constructor(
    private readonly userId: string,
    private readonly shelf?: string,
  ) {}

  async getBooks(): Promise<BookData[]> {
    const shelfQ = this.shelf ? `?shelf=${encodeURIComponent(this.shelf)}&per_page=300` : '?per_page=300';
    const proxyShelfQ = this.shelf ? `&shelf=${encodeURIComponent(this.shelf)}&per_page=300` : '&per_page=300';
    const directUrl = `https://www.goodreads.com/review/list_rss/${this.userId}${shelfQ}`;
    const proxyUrl = `${PROXY_URL}/rss?userId=${this.userId}${proxyShelfQ}`;

    let xml: string;

    try {
      // Step 2.1 — direct browser fetch
      const res = await fetch(directUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      xml = await res.text();
    } catch {
      // Step 2.2 — CORS or network failure: fall back to proxy
      const res = await fetch(proxyUrl);
      if (!res.ok) throw new Error(`Proxy error: HTTP ${res.status}`);
      xml = await res.text();
    }

    return parseGoodreadsRSS(xml);
  }
}
