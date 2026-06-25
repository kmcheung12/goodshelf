import type { IBookAdapter, BookData } from './types';
import { parseGoodreadsRSS } from './rss-parser';

const PROXY_URL = import.meta.env.VITE_PROXY_URL ?? 'http://localhost:3001';

export class GoodreadsAdapter implements IBookAdapter {
  constructor(private readonly userId: string) {}

  async getBooks(): Promise<BookData[]> {
    const directUrl = `https://www.goodreads.com/review/list_rss/${this.userId}`;
    const proxyUrl = `${PROXY_URL}/rss?userId=${this.userId}`;

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
