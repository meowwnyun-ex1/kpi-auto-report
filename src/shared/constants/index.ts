/**
 * Unified Constants System
 * Centralized constants for the entire application
 */

// Re-export notification system
export * from './notifications';

// Re-export UI constants
export * from './breakpoints';
export * from './colors';
export * from './priority-colors';
export * from './text-priority-colors';
export * from './system-standards';

// Common loading messages
export const LOADING_MESSAGES = {
  SAVING: 'Saving...',
  LOADING: 'Loading...',
  DELETING: 'Deleting...',
  PROCESSING: 'Processing...',
  INITIAL: 'Loading...',
  AUTHENTICATING: 'Signing in...',
} as const;

// Error messages
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'The username or password you entered is incorrect. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again to continue.',
  ACCESS_DENIED: 'You do not have permission to access this page. Please contact your administrator.',
  ACCOUNT_DISABLED: 'Your account has been disabled. Please contact your administrator.',
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection and try again.',
  SERVER_ERROR: 'The server is currently unavailable. Please try again in a few minutes.',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  HEALTH: '/health',
  CATEGORIES: '/categories',
  ADMIN: '/admin',
  STATS: '/stats',
  AUTH: '/auth',
} as const;
