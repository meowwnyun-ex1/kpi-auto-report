/**
 * Application Constants - Only truly reused values
 */

// Re-export from unified notification system for backward compatibility
// TODO: Update all imports to use @/constants/notifications directly
export { TOAST_MESSAGES } from '@/constants/notifications';

// Common loading messages
export const LOADING_MESSAGES = {
  SAVING: 'Saving...',
  LOADING: 'Loading...',
  DELETING: 'Deleting...',
  PROCESSING: 'Processing...',
  INITIAL: 'Loading...',
  AUTHENTICATING: 'Signing in...',
} as const;

// Error messages for other components
export const ERROR_MESSAGES = {
  INVALID_CREDENTIALS: 'The username or password you entered is incorrect. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again to continue.',
  ACCESS_DENIED:
    'You do not have permission to access this page. Please contact your administrator.',
  ACCOUNT_DISABLED: 'Your account has been disabled. Please contact your administrator.',
  NETWORK_ERROR:
    'Unable to connect to the server. Please check your internet connection and try again.',
  SERVER_ERROR: 'The server is currently unavailable. Please try again in a few minutes.',
} as const;

// API endpoints for KPI system
export const API_ENDPOINTS = {
  HEALTH: '/health',
  CATEGORIES: '/categories',
  ADMIN: '/admin',
  STATS: '/stats',
  AUTH: '/auth',
} as const;
