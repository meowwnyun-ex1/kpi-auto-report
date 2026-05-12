/**
 * Enterprise Color System - World-Class Design Standards
 * Consistent color palette for professional KPI system
 */

// ============================================
// BRAND COLORS
// ============================================

export const BRAND_COLORS = {
  primary: {
    50: '#EFF6FF',
    100: '#DBEAFE', 
    200: '#BFDBFE',
    300: '#93C5FD',
    400: '#60A5FA',
    500: '#3B82F6', // Primary brand color
    600: '#2563EB',
    700: '#1D4ED8',
    800: '#1E40AF',
    900: '#1E3A8A',
    950: '#172554',
  },
  secondary: {
    50: '#F0FDF4',
    100: '#DCFCE7',
    200: '#BBF7D0', 
    300: '#86EFAC',
    400: '#4ADE80',
    500: '#22C55E', // Secondary brand color
    600: '#16A34A',
    700: '#15803D',
    800: '#166534',
    900: '#14532D',
    950: '#052E16',
  },
  accent: {
    50: '#FEF3C7',
    100: '#FDE68A',
    200: '#FCD34D',
    300: '#FBBF24',
    400: '#F59E0B',
    500: '#F59E0B', // Accent color
    600: '#D97706',
    700: '#B45309',
    800: '#92400E',
    900: '#78350F',
    950: '#451A03',
  },
} as const;

// ============================================
// SEMANTIC COLORS - ENTERPRISE GRADE
// ============================================

export const SEMANTIC_COLORS = {
  // Success States
  success: {
    main: '#10B981',
    light: '#34D399',
    lighter: '#6EE7B7',
    background: '#ECFDF5',
    text: '#065F46',
    border: '#34D399',
  },
  
  // Warning States  
  warning: {
    main: '#F59E0B',
    light: '#FBBF24',
    lighter: '#FCD34D',
    background: '#FFFBEB',
    text: '#92400E',
    border: '#FCD34D',
  },
  
  // Error States
  error: {
    main: '#EF4444',
    light: '#F87171',
    lighter: '#FCA5A5',
    background: '#FEF2F2',
    text: '#991B1B',
    border: '#FCA5A5',
  },
  
  // Information States
  info: {
    main: '#3B82F6',
    light: '#60A5FA',
    lighter: '#93C5FD',
    background: '#EFF6FF',
    text: '#1E40AF',
    border: '#93C5FD',
  },
  
  // Neutral States
  neutral: {
    main: '#6B7280',
    light: '#9CA3AF',
    lighter: '#D1D5DB',
    background: '#F9FAFB',
    text: '#374151',
    border: '#E5E7EB',
  },
} as const;

// ============================================
// KPI CATEGORY COLORS - PROFESSIONAL PALETTE
// ============================================

export const KPI_CATEGORY_COLORS = {
  safety: {
    ...SEMANTIC_COLORS.error,
    priority: 'critical' as const,
    icon: '⚠️',
    gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
  },
  
  quality: {
    ...SEMANTIC_COLORS.success,
    priority: 'high' as const,
    icon: '✓',
    gradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
  },
  
  delivery: {
    ...SEMANTIC_COLORS.info,
    priority: 'medium' as const,
    icon: '📦',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
  },
  
  cost: {
    ...SEMANTIC_COLORS.warning,
    priority: 'high' as const,
    icon: '💰',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  },
  
  hr: {
    main: '#8B5CF6',
    light: '#A78BFA',
    lighter: '#C4B5FD',
    background: '#F3F4F6',
    text: '#5B21B6',
    border: '#C4B5FD',
    priority: 'low' as const,
    icon: '👥',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
  },
  
  environment: {
    main: '#06B6D4',
    light: '#22D3EE',
    lighter: '#67E8F9',
    background: '#ECFEFF',
    text: '#0E7490',
    border: '#67E8F9',
    priority: 'medium' as const,
    icon: '🌱',
    gradient: 'linear-gradient(135deg, #06B6D4 0%, #0891B2 100%)',
  },
  
  compliance: {
    main: '#6366F1',
    light: '#818CF8',
    lighter: '#A5B4FC',
    background: '#EEF2FF',
    text: '#4338CA',
    border: '#A5B4FC',
    priority: 'high' as const,
    icon: '⚖️',
    gradient: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
  },
  
  attractive: {
    main: '#EC4899',
    light: '#F472B6',
    lighter: '#F9A8D4',
    background: '#FDF2F8',
    text: '#9F1239',
    border: '#F9A8D4',
    priority: 'low' as const,
    icon: '✨',
    gradient: 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)',
  },
} as const;

// ============================================
// STATUS COLORS
// ============================================

export const STATUS_COLORS = {
  // Approval Status
  draft: SEMANTIC_COLORS.neutral,
  pending: {
    main: '#F59E0B',
    background: '#FFFBEB',
    text: '#92400E',
    border: '#FCD34D',
  },
  under_review: SEMANTIC_COLORS.info,
  approved: SEMANTIC_COLORS.success,
  rejected: SEMANTIC_COLORS.error,
  cancelled: SEMANTIC_COLORS.neutral,
  
  // Performance Status
  excellent: SEMANTIC_COLORS.success,
  good: KPI_CATEGORY_COLORS.hr,
  average: SEMANTIC_COLORS.warning,
  below_average: {
    main: '#FB923C',
    background: '#FFF7ED',
    text: '#9A3412',
    border: '#FDBA74',
  },
  poor: SEMANTIC_COLORS.error,
  
  // Action Plan Status
  not_started: SEMANTIC_COLORS.neutral,
  in_progress: SEMANTIC_COLORS.info,
  on_track: SEMANTIC_COLORS.success,
  at_risk: SEMANTIC_COLORS.warning,
  delayed: SEMANTIC_COLORS.error,
  completed: SEMANTIC_COLORS.success,
} as const;

// ============================================
// CHART COLORS - PROFESSIONAL DATA VISUALIZATION
// ============================================

export const CHART_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#06B6D4', // Cyan
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6366F1', // Indigo
  '#14B8A6', // Teal
] as const;

export const CHART_GRADIENTS = {
  primary: 'linear-gradient(180deg, rgba(59, 130, 246, 0.8) 0%, rgba(59, 130, 246, 0.1) 100%)',
  success: 'linear-gradient(180deg, rgba(16, 185, 129, 0.8) 0%, rgba(16, 185, 129, 0.1) 100%)',
  warning: 'linear-gradient(180deg, rgba(245, 158, 11, 0.8) 0%, rgba(245, 158, 11, 0.1) 100%)',
  error: 'linear-gradient(180deg, rgba(239, 68, 68, 0.8) 0%, rgba(239, 68, 68, 0.1) 100%)',
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getCategoryColor = (categoryKey: string) => {
  return KPI_CATEGORY_COLORS[categoryKey as keyof typeof KPI_CATEGORY_COLORS] || KPI_CATEGORY_COLORS.safety;
};

export const getStatusColor = (status: string) => {
  return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || SEMANTIC_COLORS.neutral;
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical': return SEMANTIC_COLORS.error;
    case 'high': return SEMANTIC_COLORS.warning;
    case 'medium': return SEMANTIC_COLORS.info;
    case 'low': return KPI_CATEGORY_COLORS.hr;
    default: return SEMANTIC_COLORS.neutral;
  }
};

// ============================================
// TAILWIND CSS CLASSES
// ============================================

export const getTailwindClasses = (colorSet: typeof SEMANTIC_COLORS.success) => {
  return {
    bg: `bg-[${colorSet.background}]`,
    text: `text-[${colorSet.text}]`,
    border: `border-[${colorSet.border}]`,
    button: `bg-[${colorSet.main}] hover:bg-[${colorSet.light}] text-white`,
    badge: `bg-[${colorSet.main}] text-white`,
    card: `border-[${colorSet.border}] bg-white hover:border-[${colorSet.light}]`,
  };
};

// ============================================
// CSS VARIABLES FOR DYNAMIC THEMING
// ============================================

export const CSS_VARIABLES = {
  '--color-primary-500': BRAND_COLORS.primary[500],
  '--color-primary-600': BRAND_COLORS.primary[600],
  '--color-secondary-500': BRAND_COLORS.secondary[500],
  '--color-success-main': SEMANTIC_COLORS.success.main,
  '--color-warning-main': SEMANTIC_COLORS.warning.main,
  '--color-error-main': SEMANTIC_COLORS.error.main,
  '--color-info-main': SEMANTIC_COLORS.info.main,
  '--color-neutral-main': SEMANTIC_COLORS.neutral.main,
} as const;
