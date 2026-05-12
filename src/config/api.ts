import axios from 'axios';

// API base URL - uses Vite's base URL from config
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const API_URL = `${BASE}/api`;

/**
 * Axios instance for API requests
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors globally
    if (error.response?.status === 401) {
      // Clear all auth data
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('login_time');

      // Redirect to login page if not already there
      const currentPath = window.location.pathname;
      const loginPath = import.meta.env.PROD ? '/kpi-auto-report/login' : '/login';
      if (currentPath !== loginPath) {
        // Use window.location for hard redirect to ensure state is cleared
        window.location.href = loginPath;
      }
    }
    return Promise.reject(error);
  }
);
export const UPLOADS_URL = BASE;

/**
 * Build full API endpoint URL
 * e.g. apiUrl('/kpi') => '/api/kpi' in dev, '/kpi-auto-report/api/kpi' in prod
 */
export const apiUrl = (path: string) => `${API_URL}${path}`;

/**
 * Build full uploads URL from backend image_path
 * e.g. uploadsUrl('/uploads/kpi/file.webp') => '/uploads/kpi/file.webp' in dev, '/kpi-auto-report/uploads/kpi/file.webp' in prod
 */
export const uploadsUrl = (path: string) => `${UPLOADS_URL}${path}`;

/**
 * Get API URL — uses relative '/api' path.
 * In dev: Vite proxy forwards to backend. In prod: nginx proxies to backend.
 */
export const getApiUrl = () => '/api';
