import axios from 'axios';
import useNetworkStore from '../store/networkStore';

declare const require: any;
declare const globalThis: any;

const BASE_URL = (globalThis as any).process?.env?.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const axiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const { default: useAppStore } = require('../store/useAppStore');
      const token = useAppStore.getState().token;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Interceptor: failed to read token', error);
    }
    return config;
  },
  (error) => {
    throw error;
  },
);

axiosInstance.interceptors.response.use(
  (response) => {
    const { isOffline } = useNetworkStore.getState();
    if (isOffline) {
      useNetworkStore.getState().setOnline();
    }
    return response;
  },
  (error) => {
    if (error.code === 'ECONNABORTED' || !error.response) {
      console.warn('Network error detected — switching to offline mode');
      useNetworkStore.getState().setOffline();
    }

    if (error.response && error.response.status === 401) {
      const { default: useAppStore } = require('../store/useAppStore');
      const isAuthenticated = useAppStore.getState().isAuthenticated;

      if (isAuthenticated) {
        console.warn('401 Unauthorized — logging out');
        const { router } = require('expo-router');
        useAppStore.getState().clearAuth();
        router.replace('/(auth)/welcome');
      }
    }

    throw error;
  },
);

export default axiosInstance;
