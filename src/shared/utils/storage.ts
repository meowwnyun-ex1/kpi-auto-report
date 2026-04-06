/**
 * Storage Utilities - Centralized localStorage management
 */

// Storage keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'admin_token',
  AUTH_LOGIN_TIME: 'admin_login_time',
  USER_DATA: 'admin_user',
  USER_PREFERENCES: 'user_preferences',
  SIDEBAR_STATE: 'sidebar_state',
} as const;

// Storage utility functions
export const storage = {
  // Auth token management
  getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  setAuthToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  },

  removeAuthToken(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  },

  // Login time management
  getLoginTime(): string | null {
    return localStorage.getItem(STORAGE_KEYS.AUTH_LOGIN_TIME);
  },

  setLoginTime(): void {
    localStorage.setItem(STORAGE_KEYS.AUTH_LOGIN_TIME, Date.now().toString());
  },

  removeLoginTime(): void {
    localStorage.removeItem(STORAGE_KEYS.AUTH_LOGIN_TIME);
  },

  // User data management
  getUserData(): any | null {
    const userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  },

  setUserData(userData: any): void {
    localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
  },

  removeUserData(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
  },

  // Clear all auth data
  clearAuthData(): void {
    this.removeAuthToken();
    this.removeLoginTime();
    this.removeUserData();
  },

  // Generic storage methods
  getItem(key: string): string | null {
    return localStorage.getItem(key);
  },

  setItem(key: string, value: string): void {
    localStorage.setItem(key, value);
  },

  removeItem(key: string): void {
    localStorage.removeItem(key);
  },

  // Check if session is valid (16 hours)
  isSessionValid(): boolean {
    const loginTime = this.getLoginTime();
    if (!loginTime) return false;

    const currentTime = Date.now();
    const timeElapsed = currentTime - parseInt(loginTime);
    const SESSION_TIMEOUT = 16 * 60 * 60 * 1000; // 16 hours

    return timeElapsed < SESSION_TIMEOUT;
  },

  // Extend session
  extendSession(): void {
    this.setLoginTime();
  },
};
