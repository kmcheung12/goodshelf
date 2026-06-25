import type { IBookAdapter, BookData } from './types';

export class MockAdapter implements IBookAdapter {
  async getBooks(): Promise<BookData[]> {
    return [];
  }
}
