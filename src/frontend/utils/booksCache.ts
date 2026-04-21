/**
 * Module-level in-memory cache for the full book list.
 * Both authors.tsx and author-detail.tsx fetch limit:500 books —
 * this makes sure the network call only happens once per app session.
 */

import bookService from '@/api/services/bookService';

let _cache: any[] | null = null;
let _inflight: Promise<any[]> | null = null;

export async function getCachedBooks(): Promise<any[]> {
  if (_cache !== null) return _cache;
  if (_inflight) return _inflight;

  _inflight = (async () => {
    const res = await bookService.getBooks({ limit: 500 });
    const books: any[] = res?.data?.books ?? res?.books ?? [];
    _cache = books;
    _inflight = null;
    return books;
  })();

  return _inflight;
}

/** Call this if book data has changed (e.g. after adding a new book). */
export function invalidateBooksCache() {
  _cache = null;
  _inflight = null;
}
