// ============================================
// UNIFIED COLOR SYSTEM FOR KPI APPLICATION
// ============================================

// Primary color palette - consistent across all pages
export const COLORS = {
  // Primary brand color (blue)
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

  // Semantic colors
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

  error: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },

  // Neutral colors
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },

  // Accent colors for data types
  data: {
    target: '#2563eb',      // Blue - primary data
    result: '#16a34a',     // Green - results/achievements
    usage: '#d97706',       // Orange - consumption/usage
    remaining: '#059669',  // Emerald - remaining/balance
    unit: '#7c3aed',       // Purple - units/metrics
    measurement: '#1f2937', // Dark gray - measurements
  }
} as const;

// Category colors - consistent across all pages
export const CATEGORY_COLORS = {
  safety: '#dc2626',      // Red
  quality: '#16a34a',     // Green  
  delivery: '#2563eb',    // Blue
  compliance: '#9333ea', // Purple
  hr: '#ea580c',         // Orange
  attractive: '#db2777', // Pink
  environment: '#0d9488', // Teal
  cost: '#4f46e5',       // Indigo
} as const;

// Table styling constants
export const TABLE_COLORS = {
  // Header gradients by theme
  header: {
    gray: 'bg-gradient-to-r from-gray-50 to-slate-100',
    blue: 'bg-gradient-to-r from-blue-50 to-indigo-100', 
    emerald: 'bg-gradient-to-r from-emerald-50 to-green-100',
  },

  // Row hover states
  hover: {
    gray: 'hover:bg-gray-50/30',
    blue: 'hover:bg-blue-50/30',
    emerald: 'hover:bg-emerald-50/30',
  },

  // Cell backgrounds
  cell: {
    header: 'bg-gray-50',
    rowNumber: 'bg-gray-50/50',
    data: 'bg-white',
    alternate: 'bg-gray-50/30',
  },

  // Text colors
  text: {
    header: 'text-gray-700',
    measurement: 'text-gray-900 font-bold',
    target: COLORS.data.target,
    result: COLORS.data.result,
    usage: COLORS.data.usage,
    remaining: COLORS.data.remaining,
    unit: COLORS.data.unit,
    status: {
      saving: 'text-blue-500',
      edited: 'text-amber-500',
      active: 'text-green-500',
    }
  },

  // Border colors
  border: {
    default: 'border-gray-200',
    light: 'border-gray-100',
    header: 'border-gray-300',
  }
} as const;

// Status color mappings
export const STATUS_COLORS = {
  saving: { text: 'text-blue-500', icon: '#3b82f6' },
  edited: { text: 'text-amber-500', icon: '#f59e0b' },
  active: { text: 'text-green-500', icon: '#22c55e' },
} as const;

// Button color schemes
export const BUTTON_COLORS = {
  primary: 'bg-blue-600 hover:bg-blue-700 text-white',
  secondary: 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200',
  success: 'bg-green-600 hover:bg-green-700 text-white',
  outline: 'border-gray-200 hover:bg-gray-50 text-gray-700',
} as const;
