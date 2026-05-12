/**
 * Local Storage Utilities
 * Centralized storage management for the application
 */

export const storage = {
  /**
   * Get item from localStorage
   */
  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Error getting storage item ${key}:`, error);
      }
      return null;
    }
  },

  /**
   * Set item in localStorage
   */
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Error setting storage item ${key}:`, error);
      }
    }
  },

  /**
   * Remove item from localStorage
   */
  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(`Error removing storage item ${key}:`, error);
      }
    }
  },

  /**
   * Clear all localStorage
   */
  clear(): void {
    try {
      localStorage.clear();
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error clearing storage:', error);
      }
    }
  },

  /**
   * Check if item exists in localStorage
   */
  exists(key: string): boolean {
    return localStorage.getItem(key) !== null;
  },

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    return this.get<string>('auth_token');
  },

  /**
   * Set authentication token
   */
  setAuthToken(token: string): void {
    this.set('auth_token', token);
  },

  /**
   * Remove authentication token
   */
  removeAuthToken(): void {
    this.remove('auth_token');
  },

  /**
   * Get user data from localStorage
   */
  getUserData(): any | null {
    return this.get<any>('user_data');
  },

  /**
   * Set user data in localStorage
   */
  setUserData(userData: any): void {
    this.set('user_data', userData);
  },

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    this.remove('auth_token');
    this.remove('user_data');
    this.remove('login_time');
  },

  /**
   * Set login time
   */
  setLoginTime(): void {
    this.set('login_time', Date.now());
  },

  /**
   * Extend session by updating login time
   */
  extendSession(): void {
    this.setLoginTime();
  },
};
