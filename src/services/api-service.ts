import { getApiUrl } from '@/config/api';
import { API_ENDPOINTS } from '@/shared/constants';
import { getAuthHeaders } from '@/shared/utils/session-manager';

// Simple cache implementation
const cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();

// Generic API service class
export class ApiService {
  private static getAuthHeaders(): Record<string, string> | null {
    return getAuthHeaders();
  }

  private static async requestWithoutAuth<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const apiBase = getApiUrl();
    const url = `${apiBase}${endpoint}`;

    // Check cache for GET requests
    if (options.method === 'GET' || !options.method) {
      const cacheKey = `${url}${JSON.stringify(options)}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data as T;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(`API Error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();

    // Cache GET requests for 5 minutes
    if (options.method === 'GET' || !options.method) {
      const cacheKey = `${url}${JSON.stringify(options)}`;
      cache.set(cacheKey, { data, timestamp: Date.now(), ttl: 300000 });
    }

    return data;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const apiBase = getApiUrl();
    const url = `${apiBase}${endpoint}`;

    // Check cache for GET requests
    if (options.method === 'GET' || !options.method) {
      const cacheKey = `${url}${JSON.stringify(options)}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        return cached.data as T;
      }
    }

    const headers = this.getAuthHeaders();

    if (!headers) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers as Record<string, string>),
      },
    });

    if (!response.ok) {
      // Handle 401/403 errors
      if (response.status === 401 || response.status === 403) {
        // Session will be handled by session manager
        throw new Error('Authentication failed');
      }

      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(`API Error: ${response.status} - ${errorMessage}`);
    }

    const data = await response.json();

    // Cache GET requests for 5 minutes
    if (options.method === 'GET' || !options.method) {
      const cacheKey = `${url}${JSON.stringify(options)}`;
      cache.set(cacheKey, { data, timestamp: Date.now(), ttl: 300000 });
    }

    return data;
  }

  // Clear cache for specific endpoint or all cache
  static clearCache(endpoint?: string) {
    if (endpoint) {
      const keysToDelete = Array.from(cache.keys()).filter((key) => key.includes(endpoint));
      keysToDelete.forEach((key) => cache.delete(key));
    } else {
      cache.clear();
    }
  }

  // GET requests
  static async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    let url = endpoint;
    if (params) {
      const filtered: Record<string, string> = {};
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) filtered[k] = String(v);
      }
      if (Object.keys(filtered).length > 0) {
        url = `${endpoint}?${new URLSearchParams(filtered)}`;
      }
    }
    return this.request<T>(url);
  }

  // POST requests
  static async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // PUT requests
  static async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE requests
  static async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  // File upload (multipart/form-data - do NOT set Content-Type, let browser set boundary)
  static async upload<T>(
    endpoint: string,
    formData: FormData,
    method: 'POST' | 'PUT' = 'POST'
  ): Promise<T> {
    const apiBase = getApiUrl();
    const url = `${apiBase}${endpoint}`;

    const headers = this.getAuthHeaders();

    if (!headers) {
      throw new Error('No authentication token available');
    }

    const response = await fetch(url, {
      method,
      headers,
      body: formData,
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Session will be handled by session manager
        throw new Error('Authentication failed');
      }

      let errorMessage: string;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || response.statusText;
      } catch {
        errorMessage = response.statusText;
      }
      throw new Error(`Upload Error: ${response.status} - ${errorMessage}`);
    }

    return response.json();
  }
}

// KPI System Services
export const AuthService = {
  // Login
  login: (credentials: { username: string; password: string }) =>
    ApiService.post(`${API_ENDPOINTS.AUTH}/login`, credentials),

  // Logout
  logout: () => ApiService.post(`${API_ENDPOINTS.AUTH}/logout`),

  // Get current user
  getCurrentUser: () => ApiService.get(`${API_ENDPOINTS.AUTH}/me`),
};

export const StatsService = {
  // Get general stats
  getGeneralStats: () => ApiService.get(API_ENDPOINTS.STATS),
};
