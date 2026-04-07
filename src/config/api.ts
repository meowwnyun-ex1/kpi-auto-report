// API base URL - uses Vite's base URL from config
const BASE = import.meta.env.BASE_URL.replace(/\/+$/, '');

export const API_URL = `${BASE}/api`;
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
