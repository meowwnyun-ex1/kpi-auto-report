/**
 * MODERN DESIGN SYSTEM
 * ระบบออกแบบใหม่ - สวยงาม ทันสมัย ใช้งานง่าย
 */

// ============================================
// COLOR PALETTE - Modern Professional Theme
// ============================================

export const COLORS = {
  // Primary - Deep Blue
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
  
  // Secondary - Teal/Cyan
  secondary: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf',
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
  },
  
  // Success - Green
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  // Warning - Amber
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  // Danger - Rose
  danger: {
    50: '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },
  
  // Gray - Neutral
  gray: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  
  // Purple - Accent
  purple: {
    50: '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7c3aed',
    800: '#6b21a8',
    900: '#581c87',
  },
};

// ============================================
// SHADOWS - Modern Depth
// ============================================

export const SHADOWS = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
};

// ============================================
// BORDER RADIUS - Smooth Corners
// ============================================

export const RADIUS = {
  none: '0',
  sm: '0.375rem',    // 6px
  md: '0.5rem',      // 8px
  lg: '0.75rem',     // 12px
  xl: '1rem',        // 16px
  '2xl': '1.5rem',   // 24px
  '3xl': '2rem',     // 32px
  full: '9999px',
};

// ============================================
// SPACING - Consistent Layout
// ============================================

export const SPACING = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem',     // 96px
};

// ============================================
// TYPOGRAPHY - Clean Fonts
// ============================================

export const TYPOGRAPHY = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],
    sm: ['0.875rem', { lineHeight: '1.25rem' }],
    base: ['1rem', { lineHeight: '1.5rem' }],
    lg: ['1.125rem', { lineHeight: '1.75rem' }],
    xl: ['1.25rem', { lineHeight: '1.75rem' }],
    '2xl': ['1.5rem', { lineHeight: '2rem' }],
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
};

// ============================================
// ANIMATIONS - Smooth Interactions
// ============================================

export const ANIMATIONS = {
  fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
  normal: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
  slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  bounce: '500ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
};

// ============================================
// CATEGORY COLORS - KPI Categories
// ============================================

export const CATEGORY_COLORS = {
  safety: { color: '#ef4444', bg: '#fef2f2', gradient: 'from-red-500 to-red-600' },
  quality: { color: '#22c55e', bg: '#f0fdf4', gradient: 'from-green-500 to-green-600' },
  delivery: { color: '#3b82f6', bg: '#eff6ff', gradient: 'from-blue-500 to-blue-600' },
  cost: { color: '#f59e0b', bg: '#fffbeb', gradient: 'from-amber-500 to-amber-600' },
  hr: { color: '#8b5cf6', bg: '#faf5ff', gradient: 'from-violet-500 to-violet-600' },
  environment: { color: '#14b8a6', bg: '#f0fdfa', gradient: 'from-teal-500 to-teal-600' },
  compliance: { color: '#64748b', bg: '#f8fafc', gradient: 'from-slate-500 to-slate-600' },
  attractive: { color: '#ec4899', bg: '#fdf2f8', gradient: 'from-pink-500 to-pink-600' },
};

// ============================================
// STATUS COLORS - Approval Status
// ============================================

export const STATUS_COLORS = {
  draft: { color: '#64748b', bg: '#f1f5f9', border: '#e2e8f0' },
  pending: { color: '#f59e0b', bg: '#fef3c7', border: '#fcd34d' },
  hos_approved: { color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd' },
  hod_approved: { color: '#14b8a6', bg: '#ccfbf1', border: '#99f6e4' },
  admin_approved: { color: '#22c55e', bg: '#dcfce7', border: '#86efac' },
  rejected: { color: '#ef4444', bg: '#fee2e2', border: '#fecaca' },
  returned: { color: '#f97316', bg: '#ffedd5', border: '#fdba74' },
};

// ============================================
// LAYOUT CONSTANTS
// ============================================

export const LAYOUT = {
  sidebarWidth: '280px',
  sidebarCollapsedWidth: '72px',
  headerHeight: '64px',
  maxContentWidth: '1440px',
  pagePadding: '24px',
};

// ============================================
// COMPONENT STYLES
// ============================================

export const COMPONENT_STYLES = {
  card: {
    base: 'bg-white rounded-xl border border-gray-200 shadow-sm',
    hover: 'hover:shadow-md hover:border-gray-300 transition-all duration-200',
    selected: 'ring-2 ring-primary-500 border-primary-500',
  },
  
  button: {
    base: 'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
    primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm hover:shadow',
    secondary: 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 hover:border-gray-400',
    ghost: 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    danger: 'bg-danger-600 text-white hover:bg-danger-700',
  },
  
  input: {
    base: 'w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400',
    focus: 'focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500',
    error: 'border-danger-300 focus:border-danger-500 focus:ring-danger-500/20',
  },
  
  table: {
    base: 'w-full text-sm text-left',
    header: 'bg-gray-50/80 text-gray-600 font-semibold uppercase tracking-wider text-xs',
    row: 'border-b border-gray-100 hover:bg-gray-50/50 transition-colors',
    cell: 'px-4 py-3',
  },
};

// ============================================
// BREAKPOINTS
// ============================================

export const BREAKPOINTS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

// ============================================
// Z-INDEX SCALE
// ============================================

export const Z_INDEX = {
  base: 0,
  dropdown: 50,
  sticky: 100,
  modal: 200,
  popover: 300,
  tooltip: 400,
  toast: 500,
};
