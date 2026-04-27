/**
 * Session Management Utilities
 * Handles authentication headers and session timeout
 */

import { getApiUrl } from '@/config/api';

/**
 * Get authentication headers for API requests
 */
export const getAuthHeaders = (): Record<string, string> => {
  const token = localStorage.getItem('auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
};

/**
 * Create session timeout checker
 */
export const createSessionTimeoutChecker = (
  onTimeout: () => void,
  warningTime: number = 5 * 60 * 1000 // 5 minutes before timeout
) => {
  let timeoutId: NodeJS.Timeout;
  let warningId: NodeJS.Timeout | null = null;

  const checkSession = () => {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      onTimeout();
      return;
    }

    // Parse JWT token to check expiration
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      if (timeUntilExpiration <= 0) {
        onTimeout();
      } else if (timeUntilExpiration <= warningTime) {
        // Show warning
        console.warn('Session will expire soon');
      } else {
        // Schedule next check
        timeoutId = setTimeout(checkSession, Math.min(timeUntilExpiration, 60000)); // Check every minute or until expiration
      }
    } catch (error) {
      console.error('Error parsing token:', error);
      onTimeout();
    }
  };

  const start = () => {
    checkSession();
  };

  const stop = () => {
    if (timeoutId) clearTimeout(timeoutId);
    if (warningId) clearTimeout(warningId);
  };

  return { start, stop };
};
