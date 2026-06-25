import type { BookData, BookShelf } from './types';

function text(el: Element, tag: string): string {
  return el.getElementsByTagName(tag)[0]?.textContent?.trim() ?? '';
}

function parseDate(str: string): Date | undefined {
  if (!str) return undefined;
  const d = new Date(str);
  return isNaN(d.getTime()) ? undefined : d;
}

function parseShelf(raw: string): BookShelf | undefined {
  if (raw === 'read') return 'read';
  if (raw === 'to-read') return 'to-read';
  if (raw === 'currently-reading') return 'currently-reading';
  return undefined;
}

export function parseGoodreadsRSS(xml: string): BookData[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, 'application/xml');
  const items = Array.from(doc.getElementsByTagName('item'));

  return items.map((item, i): BookData => {
    const bookId = text(item, 'book_id') || String(i);
    const title = text(item, 'title') || 'Unknown Title';
    const author = text(item, 'author_name') || 'Unknown Author';
    const coverUrl = text(item, 'book_large_image_url') ||
                     text(item, 'book_medium_image_url') ||
                     text(item, 'book_image_url') || undefined;
    const shelf = parseShelf(text(item, 'user_shelves'));
    const dateAdded = parseDate(text(item, 'user_date_added'));

    return {
      id: bookId,
      title,
      author,
      coverUrl: coverUrl || undefined,
      shelf,
      dateAdded,
    };
  });
}
