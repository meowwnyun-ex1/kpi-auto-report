/**
 * Utility Library
 * Centralized utilities for the application
 */

export { storage } from './storage';
export { getAuthHeaders, createSessionTimeoutChecker } from './session-manager';
export { useSystemStandards, useSystemValidation } from './useSystemStandards';
export { useUnifiedColors } from './useUnifiedColors';
export { getFallbackImage } from './image-utils';

// Number formatting utilities
export { formatNumber, formatDecimal, formatPercent } from './formatting-utils';

// Re-export other utilities that might be in lib/utils.ts
export { cn } from './utils';
