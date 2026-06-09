import api from '../axiosInstance';
import { filterBooksWithCovers } from '../../utils/bookFilters';

type BooksParams = Record<string, any> & {
  branchId?: string;
  branchIds?: string[] | string;
  limit?: number;
};

function getBooksArray(payload: any): any[] {
  return payload?.data?.books ?? payload?.books ?? [];
}

export interface BookService {
  getBooks: (params?: BooksParams) => Promise<any>;
  searchBooks: (query: string) => Promise<any>;
  getBookById: (bookId: string, params?: Record<string, any>) => Promise<any>;
  getBookAvailability: (bookId: string, lat?: number, lng?: number) => Promise<any>;
  getBookCopies: (bookId: string) => Promise<any>;
  issueBook: (bookId: string, branchId: string, profileId: string) => Promise<any>;
  returnBook: (issueId: string) => Promise<any>;
}

const bookService: BookService = {
  getBooks: async (params: BooksParams = {}) => {
    if (params?.branchId && !params?.branchIds) {
      const branchId = params.branchId;
      const { branchId: _branchId, ...rest } = params;
      const response = await api.get(`/books/branch/${branchId}`, { params: rest });
      const books = getBooksArray(response.data);
      if (Array.isArray(books)) {
        if (response.data?.data?.books) response.data.data.books = filterBooksWithCovers(books);
        if (response.data?.books) response.data.books = filterBooksWithCovers(books);
      }
      return response.data;
    }

    const response = await api.get('/books', { params });
    const books = getBooksArray(response.data);
    if (Array.isArray(books)) {
      if (response.data?.data?.books) response.data.data.books = filterBooksWithCovers(books);
      if (response.data?.books) response.data.books = filterBooksWithCovers(books);
    }
    return response.data;
  },

  searchBooks: async (query: string) => {
    const response = await api.get('/books/search', { params: { q: query } });
    const books = getBooksArray(response.data);
    if (Array.isArray(books)) {
      if (response.data?.data?.books) response.data.data.books = filterBooksWithCovers(books);
      if (response.data?.books) response.data.books = filterBooksWithCovers(books);
    }
    return response.data;
  },

  getBookById: async (bookId: string, params: Record<string, any> = {}) => {
    const response = await api.get(`/books/${bookId}`, { params });
    return response.data;
  },

  getBookAvailability: async (bookId: string, lat?: number, lng?: number) => {
    const params: Record<string, number> = {};
    if (lat != null && lng != null) {
      params.lat = lat;
      params.lng = lng;
    }
    const response = await api.get(`/books/${bookId}/availability`, { params });
    return response.data;
  },

  getBookCopies: async (bookId: string) => {
    const response = await api.get(`/books/${bookId}/copies`);
    return response.data;
  },

  issueBook: async (bookId: string, branchId: string, profileId: string) => {
    const response = await api.post('/issues', { bookId, branchId, profileId, type: 'PHYSICAL' });
    return response.data;
  },

  returnBook: async (issueId: string) => {
    const response = await api.put(`/issues/${issueId}/return`);
    return response.data;
  },
};

export default bookService;
