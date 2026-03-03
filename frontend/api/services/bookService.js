import api from '../axiosInstance';

/**
 * Book Service
 * Handles all book-related API calls: browse, search, availability,
 * issue, and return operations.
 */
const bookService = {
    /**
     * Fetch the full book catalog.
     * The response is cached in AsyncStorage by the bookStore.
     */
    getBooks: async () => {
        const response = await api.get('/books');
        return response.data;
    },

    /**
     * Search books by title, author, or genre.
     * @param {string} query - Search term
     */
    searchBooks: async (query) => {
        const response = await api.get('/books/search', { params: { q: query } });
        return response.data;
    },

    /**
     * Check availability of a specific book across nearby libraries.
     * @param {string} bookId
     */
    getBookAvailability: async (bookId) => {
        const response = await api.get(`/books/${bookId}/availability`);
        return response.data;
    },

    /**
     * Fetch all copies of a book (with status, condition, branch info).
     * @param {string} bookId
     */
    getBookCopies: async (bookId) => {
        const response = await api.get(`/books/${bookId}/copies`);
        return response.data;
    },

    /**
     * Issue (rent) a book copy to a profile.
     * @param {string} copyId - BookCopy ID (not Book ID)
     * @param {string} profileId
     */
    issueBook: async (copyId, profileId) => {
        const response = await api.post('/books/issue', { copyId, profileId });
        return response.data;
    },

    /**
     * Return an issued book.
     * @param {string} issueId
     */
    returnBook: async (issueId) => {
        const response = await api.post('/books/return', { issueId });
        return response.data;
    },
};

export default bookService;
