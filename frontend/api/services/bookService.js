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
    getBooks: async (params = {}) => {
        const response = await api.get('/books', { params });
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
     * Get a single book by ID
     * @param {string} bookId 
     */
    getBookById: async (bookId) => {
        const response = await api.get(`/books/${bookId}`);
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
     * @param {string} bookId - Book ID
     * @param {string} branchId - Library branch ID
     * @param {string} profileId - User Profile ID
     */
    issueBook: async (bookId, branchId, profileId) => {
        const response = await api.post('/issues', { bookId, branchId, profileId, type: 'PHYSICAL' });
        return response.data;
    },

    /**
     * Return an issued book.
     * @param {string} issueId
     */
    returnBook: async (issueId) => {
        const response = await api.put(`/issues/${issueId}/return`);
        return response.data;
    },
};

export default bookService;
