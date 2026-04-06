/**
 * Application Constants - Only truly reused values
 */

// API Endpoints (used in api-service.ts and multiple pages)
export const API_ENDPOINTS = {
  HEALTH: '/health',
  APPS: '/apps',
  CATEGORIES: '/categories',
  ADMIN: '/admin',
  BANNERS: '/banners',
  TRIPS: '/trips',
  STATS: '/stats',
  AUTH: '/auth',
} as const;

// Pagination (used in pagination component and admin pages)
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 9,
  ADMIN_PAGE_SIZE: 10,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Toast Messages (reused across admin pages and forms)
export const TOAST_MESSAGES = {
  APPLICATION_SAVED: 'Application saved successfully!',
  APPLICATION_DELETED: 'Application deleted successfully!',
  APPLICATION_SUBMITTED: 'Application submitted for review!',
  CATEGORY_SAVED: 'Category saved successfully!',
  BANNER_SAVED: 'Banner saved successfully!',
  BANNER_DELETED: 'Banner deleted successfully!',
  TRIP_SAVED: 'Trip saved successfully!',
  TRIP_DELETED: 'Trip deleted successfully!',
  STATUS_UPDATED: 'Status updated successfully!',
  FAILED_SAVE_APPLICATION: 'Failed to save application',
  FAILED_SAVE_CATEGORY: 'Failed to save category',
  FAILED_SAVE_BANNER: 'Failed to save banner',
  FAILED_SAVE_TRIP: 'Failed to save trip',
  FAILED_DELETE_APPLICATION: 'Failed to delete application',
  FAILED_DELETE_CATEGORY: 'Failed to delete category',
  FAILED_DELETE_BANNER: 'Failed to delete banner',
  FAILED_DELETE_TRIP: 'Failed to delete trip',
  FAILED_UPDATE_STATUS: 'Failed to update status',
  FAILED_FETCH_TRIPS: 'Failed to fetch trips',
  FAILED_FETCH_BANNERS: 'Failed to fetch banners',
} as const;

// Dialog Messages (reused across admin pages)
export const DIALOG_TEXTS = {
  CONFIRM: 'Confirm',
  CANCEL: 'Cancel',
  DELETE_APPLICATION_TITLE: 'Delete Application',
  DELETE_APPLICATION_DESC: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  DELETE_CATEGORY_TITLE: 'Delete Category',
  DELETE_CATEGORY_DESC: 'This action cannot be undone. The category will be permanently removed.',
  DELETE_BANNER_TITLE: 'Delete Banner',
  DELETE_BANNER_DESC: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
  DELETE_TRIP_TITLE: 'Delete Trip',
  DELETE_TRIP_DESC: (name: string) =>
    `Are you sure you want to delete "${name}"? This action cannot be undone.`,
} as const;

// Status Toggle Messages (reused across admin pages)
export const STATUS_TOGGLE_MESSAGES = {
  CATEGORY_ACTIVATED: 'Category activated successfully!',
  CATEGORY_DEACTIVATED: 'Category deactivated successfully!',
  BANNER_ACTIVATED: 'Banner activated successfully!',
  BANNER_DEACTIVATED: 'Banner deactivated successfully!',
  TRIP_ACTIVATED: 'Trip activated successfully!',
  TRIP_DEACTIVATED: 'Trip deactivated successfully!',
} as const;

// User-Friendly Error Messages
export const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_CREDENTIALS: 'The username or password you entered is incorrect. Please try again.',
  SESSION_EXPIRED: 'Your session has expired. Please sign in again to continue.',
  ACCESS_DENIED:
    'You do not have permission to access this page. Please contact your administrator.',
  ACCOUNT_DISABLED: 'Your account has been disabled. Please contact your administrator.',

  // Network Errors
  NETWORK_ERROR:
    'Unable to connect to the server. Please check your internet connection and try again.',
  SERVER_ERROR: 'The server is currently unavailable. Please try again in a few minutes.',
  TIMEOUT_ERROR: 'The request took too long to complete. Please try again.',

  // Validation Errors
  REQUIRED_FIELD: 'This field is required.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  INVALID_URL: 'Please enter a valid URL (e.g., https://example.com).',
  PASSWORD_TOO_SHORT: 'Password must be at least 8 characters long.',

  // Data Errors
  NOT_FOUND: 'The requested item could not be found. It may have been deleted or moved.',
  ALREADY_EXISTS: 'An item with this name already exists. Please choose a different name.',

  // File Errors
  FILE_TOO_LARGE: 'The file is too large. Maximum size allowed is 5MB.',
  INVALID_FILE_TYPE: 'Invalid file type. Only JPG, PNG, and GIF images are allowed.',
  UPLOAD_FAILED: 'Failed to upload the file. Please try again.',

  // Generic Errors
  UNEXPECTED_ERROR:
    'An unexpected error occurred. Please try again or contact support if the problem persists.',
  SAVE_FAILED: 'Failed to save your changes. Please try again.',
  DELETE_FAILED: 'Failed to delete the item. Please try again.',
  LOAD_FAILED: 'Failed to load the data. Please refresh the page and try again.',
} as const;

// Loading Messages
export const LOADING_MESSAGES = {
  INITIAL: 'Loading...',
  AUTHENTICATING: 'Signing in...',
  SAVING: 'Saving changes...',
  DELETING: 'Deleting...',
  UPLOADING: 'Uploading file...',
  LOADING_APPS: 'Loading applications...',
  LOADING_CATEGORIES: 'Loading categories...',
  LOADING_BANNERS: 'Loading banners...',
  LOADING_TRIPS: 'Loading trips...',
  LOADING_STATS: 'Loading statistics...',
  REFRESHING: 'Refreshing data...',
} as const;
