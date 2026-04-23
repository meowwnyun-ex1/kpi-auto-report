/**
 * Application Constants - Only truly reused values
 */

// Common toast messages used across multiple components
export const TOAST_MESSAGES = {
  // Success messages
  SAVE_SUCCESS: 'Saved successfully',
  DELETE_SUCCESS: 'Deleted successfully',
  ADD_SUCCESS: 'Added successfully',

  // Error messages
  SAVE_FAILED: 'Unable to save. Please try again.',
  DELETE_FAILED: 'Unable to delete. Please try again.',
  LOAD_FAILED: 'Unable to load data. Please try again.',
  CONNECTION_ERROR: 'Unable to connect. Please check your connection and try again.',
  ACCESS_DENIED: 'You do not have permission to perform this action.',
  INVALID_INPUT: 'Invalid input. Please check and try again.',

  // Validation messages
  REQUIRED_FIELD: 'This field is required.',
  INVALID_FORMAT: 'Invalid format. Please check and try again.',
} as const;

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
