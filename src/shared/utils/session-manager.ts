/**
 * Session Management Utilities
 * Centralized session validation and error handling
 */

import { storage } from './storage';

export interface SessionValidationResult {
  isValid: boolean;
  shouldRedirect: boolean;
  toastMessage?: {
    title: string;
    description: string;
    variant: 'destructive' | 'default';
  };
}

/**
 * Centralized session validation function
 * Returns validation result with appropriate actions
 */
export function validateSession(): SessionValidationResult {
  const token = storage.getAuthToken();

  if (!token) {
    return {
      isValid: false,
      shouldRedirect: true,
      toastMessage: {
        title: 'Authentication Required',
        description: 'Please login to access this feature.',
        variant: 'destructive' as const,
      },
    };
  }

  if (!storage.isSessionValid()) {
    return {
      isValid: false,
      shouldRedirect: true,
      toastMessage: {
        title: 'Session Expired',
        description: 'Your session has expired. Please login again.',
        variant: 'destructive' as const,
      },
    };
  }

  return {
    isValid: true,
    shouldRedirect: false,
  };
}

/**
 * Handle session validation with automatic redirect
 * Returns true if session is valid, false if redirected
 */
export function handleSessionValidation(
  logout: () => void,
  navigate: (path: string) => void,
  toast?: (options: any) => void
): boolean {
  const validation = validateSession();

  if (!validation.isValid && validation.shouldRedirect) {
    // Show toast if available
    if (toast && validation.toastMessage) {
      toast(validation.toastMessage);
    }

    // Logout and redirect
    logout();
    navigate('/admin/login');
    return false;
  }

  return true;
}

/**
 * Session validation hook for API calls
 * Returns headers with authorization if session is valid
 */
export function getAuthHeaders(): Record<string, string> | null {
  const token = storage.getAuthToken();

  // If no token at all, return null
  if (!token) {
    return null;
  }

  // If session is expired, still return headers for API calls
  // Let the server decide if the token is valid
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  return headers;
}

/**
 * Centralized error handler for 401/403 responses
 */
export function handleAuthError(
  error: Response,
  logout: () => void,
  navigate: (path: string) => void,
  toast?: (options: any) => void
): void {
  if (error.status === 401 || error.status === 403) {
    const toastMessage =
      error.status === 401
        ? {
            title: 'Authentication Failed',
            description: 'Your session has expired. Please login again.',
            variant: 'destructive' as const,
          }
        : {
            title: 'Access Denied',
            description: 'You do not have permission to perform this action.',
            variant: 'destructive' as const,
          };

    if (toast) {
      toast(toastMessage);
    }

    logout();
    navigate('/admin/login');
  }
}

/**
 * Session timeout checker
 * Can be used in intervals to check session validity
 */
export function createSessionTimeoutChecker(
  onTimeout: () => void,
  intervalMs: number = 5 * 60 * 1000 // 5 minutes
): () => void {
  const interval = setInterval(() => {
    if (!storage.isSessionValid()) {
      onTimeout();
    }
  }, intervalMs);

  return () => clearInterval(interval);
}
