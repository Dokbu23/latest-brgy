// src/api/setupAxios.js
import axios from 'axios';
import safeStorage from '../utils/safeStorage'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
});

// Send cookies by default (for Sanctum cookie-based auth)
axiosInstance.defaults.withCredentials = true;

// Add token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    try {
      const token = safeStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      // safeStorage itself already logs, but keep defensive here
      console.warn('storage read error in interceptor:', e && e.message)
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
