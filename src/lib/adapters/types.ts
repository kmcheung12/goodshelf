export type BookShelf = 'read' | 'to-read' | 'currently-reading';

export interface BookData {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  spineColor?: string;
  dateAdded?: Date;
  shelf?: BookShelf;
  numPages?: number;
  year?: number;
}

export interface IBookAdapter {
  getBooks(): Promise<BookData[]>;
}
