export type BookShelf = 'read' | 'to-read' | 'currently-reading';

export interface BookData {
  id: string;
  title: string;
  author: string;
  coverUrl?: string;
  spineColor?: string;
  dateAdded?: Date;
  shelf?: BookShelf;
}

export interface IBookAdapter {
  getBooks(): Promise<BookData[]>;
}
