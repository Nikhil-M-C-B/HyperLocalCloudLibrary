import { secureStorage } from '../../utils/storage';
import api from '../axiosInstance';

/**
 * Auth Service
 * Handles user registration, login, and logout API calls.
 * On successful login, the JWT token is stored in SecureStore.
 */
const authService = {
    /**
     * Register a new user account.
     * @param {Object} userData - { useremail, userpassword, phone }
     */
    register: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },

    /**
     * Login with email and password.
     * Stores the returned JWT in SecureStore for future requests.
     * @param {string} email
     * @param {string} password
     * @returns {{ user, token }} User data and JWT token
     */
    login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { user, token } = response.data;

        // Persist token securely
        await secureStorage.setToken(token);

        return { user, token };
    },

    /**
     * Logout: clear the stored JWT token.
     */
    logout: async () => {
        await secureStorage.removeToken();
    },
};

export default authService;
