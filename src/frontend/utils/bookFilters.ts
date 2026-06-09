export type BookLike = {
  coverImage?: string | null;
  [key: string]: any;
};

export function hasCoverImage(book: BookLike): boolean {
  return Boolean(book && typeof book.coverImage === 'string' && book.coverImage.trim());
}

export function filterBooksWithCovers<T extends BookLike>(books: T[] | null | undefined): T[] {
  if (!Array.isArray(books)) return [];
  return books.filter(hasCoverImage);
}
