/**
 * Enterprise Design Tokens
 * Source of truth for all UI values
 */

export const designTokens = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
    },
    semantic: {
      success: { light: '#dcfce7', DEFAULT: '#22c55e', dark: '#15803d' },
      warning: { light: '#fef3c7', DEFAULT: '#f59e0b', dark: '#b45309' },
      error: { light: '#fee2e2', DEFAULT: '#ef4444', dark: '#b91c1c' },
      info: { light: '#dbeafe', DEFAULT: '#3b82f6', dark: '#1d4ed8' },
    },
    data: {
      blue: '#3b82f6',
      cyan: '#06b6d4',
      emerald: '#10b981',
      amber: '#f59e0b',
      rose: '#f43f5e',
      violet: '#8b5cf6',
      slate: '#64748b',
    },
    categories: {
      safety: '#ef4444',
      quality: '#3b82f6',
      delivery: '#f59e0b',
      compliance: '#8b5cf6',
      hr: '#ec4899',
      attractive: '#f97316',
      environment: '#84cc16',
      cost: '#6b7280',
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      mono: ['JetBrains Mono', 'monospace'],
    },
    sizes: {
      xs: { size: '0.75rem', lineHeight: '1rem' },
      sm: { size: '0.875rem', lineHeight: '1.25rem' },
      base: { size: '1rem', lineHeight: '1.5rem' },
      lg: { size: '1.125rem', lineHeight: '1.75rem' },
      xl: { size: '1.25rem', lineHeight: '1.75rem' },
      '2xl': { size: '1.5rem', lineHeight: '2rem' },
      '3xl': { size: '1.875rem', lineHeight: '2.25rem' },
      '4xl': { size: '2.25rem', lineHeight: '2.5rem' },
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    0: '0', 1: '0.25rem', 2: '0.5rem', 3: '0.75rem',
    4: '1rem', 5: '1.25rem', 6: '1.5rem', 8: '2rem',
    10: '2.5rem', 12: '3rem', 16: '4rem', 20: '5rem', 24: '6rem',
  },
  radius: {
    none: '0', sm: '0.125rem', DEFAULT: '0.25rem',
    md: '0.375rem', lg: '0.5rem', xl: '0.75rem',
    '2xl': '1rem', '3xl': '1.5rem', full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  },
  breakpoints: {
    sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px',
  },
  zIndex: {
    hide: -1, base: 0, docked: 10, dropdown: 1000,
    sticky: 1100, banner: 1200, overlay: 1300,
    modal: 1400, popover: 1500, toast: 1700, tooltip: 1800,
  },
  transitions: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    DEFAULT: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

export type Breakpoint = keyof typeof designTokens.breakpoints;
export type ColorToken = keyof typeof designTokens.colors;
