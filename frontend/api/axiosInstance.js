import axios from 'axios';
import useAuthStore from '../store/authStore';
import useNetworkStore from '../store/networkStore';
import { secureStorage } from '../utils/storage';

/**
 * Axios Instance
 *
 * Central HTTP client with:
 *  - 5-second timeout (catches slow networks before UI freezes)
 *  - Request interceptor: auto-attaches JWT from SecureStore
 *  - Response error interceptor: offline detection → Zustand update
 *
 * All API service modules import this instance instead of raw axios.
 */

// Base URL is configurable — point this to your Node.js backend
// Backend runs on port 5000 with /api/v1 prefix
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 5000, // 5 seconds — fail fast on slow networks
    headers: {
        'Content-Type': 'application/json',
    },
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// REQUEST INTERCEPTOR
// Reads the JWT from SecureStore and attaches it to every
// outgoing request. No need to pass tokens manually.
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
axiosInstance.interceptors.request.use(
    async (config) => {
        try {
            const token = await secureStorage.getToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        } catch (error) {
            console.error('Interceptor: failed to read token', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RESPONSE ERROR INTERCEPTOR
// Handles two critical scenarios:
//  1. Timeout / Network error → set isOffline in Zustand
//  2. 401 Unauthorized → auto-logout (token expired)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
axiosInstance.interceptors.response.use(
    (response) => {
        // Successful response → make sure we're marked as online
        const { isOffline } = useNetworkStore.getState();
        if (isOffline) {
            useNetworkStore.getState().setOnline();
        }
        return response;
    },
    (error) => {
        // Timeout or no response (network down)
        if (error.code === 'ECONNABORTED' || !error.response) {
            console.warn('Network error detected — switching to offline mode');
            useNetworkStore.getState().setOffline();
        }

        // Token expired / unauthorized
        if (error.response && error.response.status === 401) {
            console.warn('401 Unauthorized — logging out');
            useAuthStore.getState().logout();
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;
