/**
 * Text Priority Color System
 * ระบบสีสำหรับข้อความและค่าตัวเลขที่สำคัญ
 */

// ============================================
// TEXT PRIORITY LEVELS
// ============================================

export type TextPriority = 
  | 'critical'    // ค่าวิกฤติ - สีแดงเข้ม
  | 'high'        // ค่าสูง - สีส้มเข้ม
  | 'medium'      // ค่ากลาง - สีฟ้าเข้ม
  | 'low'         // ค่าต่ำ - สีเขียวเข้ม
  | 'positive'    // ค่าบวก/ดีขึ้น - สีเขียวสด
  | 'negative'    // ค่าลบ/แย่ลง - สีแดงสด
  | 'neutral'     // ค่าปกติ - สีเทาเข้ม
  | 'highlight'   // เน้นพิเศษ - สีม่วงเข้ม
  | 'warning'     // เตือน - สีเหลืองเข้ม
  | 'success'     // สำเร็จ - สีเขียวเข้ม
  | 'info'        // ข้อมูล - สีน้ำเงินเข้น
  | 'muted';      // ซ่อนเสียง - สีเทาอ่อน

// ============================================
// TEXT PRIORITY COLORS
// ============================================

export const TEXT_PRIORITY_COLORS = {
  // Critical - ค่าวิกฤติ สีแดงเข้ม
  critical: {
    text: '#DC2626',        // red-600
    text_light: '#B91C1C',  // red-700
    text_dark: '#991B1B',   // red-800
    bg: '#FEE2E2',          // red-100
    bg_light: '#FECACA',    // red-200
    border: '#FCA5A5',      // red-300
    icon: '#DC2626',
  },
  
  // High - ค่าสูง สีส้มเข้ม
  high: {
    text: '#EA580C',        // orange-600
    text_light: '#C2410C',  // orange-700
    text_dark: '#9A3412',   // orange-800
    bg: '#FED7AA',          // orange-100
    bg_light: '#FDBA74',    // orange-200
    border: '#FB923C',      // orange-300
    icon: '#EA580C',
  },
  
  // Medium - ค่ากลาง สีฟ้าเข้ม
  medium: {
    text: '#2563EB',        // blue-600
    text_light: '#1D4ED8',  // blue-700
    text_dark: '#1E40AF',   // blue-800
    bg: '#DBEAFE',          // blue-100
    bg_light: '#BFDBFE',    // blue-200
    border: '#93C5FD',      // blue-300
    icon: '#2563EB',
  },
  
  // Low - ค่าต่ำ สีเขียวเข้ม
  low: {
    text: '#059669',        // emerald-600
    text_light: '#047857',  // emerald-700
    text_dark: '#065F46',   // emerald-800
    bg: '#D1FAE5',          // emerald-100
    bg_light: '#A7F3D0',    // emerald-200
    border: '#6EE7B7',      // emerald-300
    icon: '#059669',
  },
  
  // Positive - ค่าบวก/ดีขึ้น สีเขียวสด
  positive: {
    text: '#16A34A',        // green-600
    text_light: '#15803D',  // green-700
    text_dark: '#166534',   // green-800
    bg: '#DCFCE7',          // green-100
    bg_light: '#BBF7D0',    // green-200
    border: '#86EFAC',      // green-300
    icon: '#16A34A',
  },
  
  // Negative - ค่าลบ/แย่ลง สีแดงสด
  negative: {
    text: '#DC2626',        // red-600
    text_light: '#B91C1C',  // red-700
    text_dark: '#991B1B',   // red-800
    bg: '#FEE2E2',          // red-100
    bg_light: '#FECACA',    // red-200
    border: '#FCA5A5',      // red-300
    icon: '#DC2626',
  },
  
  // Neutral - ค่าปกติ สีเทาเข้ม
  neutral: {
    text: '#374151',        // gray-700
    text_light: '#4B5563',  // gray-600
    text_dark: '#1F2937',   // gray-800
    bg: '#F3F4F6',          // gray-100
    bg_light: '#E5E7EB',    // gray-200
    border: '#D1D5DB',      // gray-300
    icon: '#6B7280',
  },
  
  // Highlight - เน้นพิเศษ สีม่วงเข้ม
  highlight: {
    text: '#9333EA',        // purple-600
    text_light: '#7C3AED',  // purple-700
    text_dark: '#6D28D9',   // purple-800
    bg: '#F3E8FF',          // purple-100
    bg_light: '#E9D5FF',    // purple-200
    border: '#D8B4FE',      // purple-300
    icon: '#9333EA',
  },
  
  // Warning - เตือน สีเหลืองเข้ม
  warning: {
    text: '#D97706',        // amber-600
    text_light: '#B45309',  // amber-700
    text_dark: '#92400E',   // amber-800
    bg: '#FEF3C7',          // amber-100
    bg_light: '#FDE68A',    // amber-200
    border: '#FCD34D',      // amber-300
    icon: '#D97706',
  },
  
  // Success - สำเร็จ สีเขียวเข้ม
  success: {
    text: '#059669',        // emerald-600
    text_light: '#047857',  // emerald-700
    text_dark: '#065F46',   // emerald-800
    bg: '#D1FAE5',          // emerald-100
    bg_light: '#A7F3D0',    // emerald-200
    border: '#6EE7B7',      // emerald-300
    icon: '#059669',
  },
  
  // Info - ข้อมูล สีน้ำเงินเข้น
  info: {
    text: '#0284C7',        // cyan-600
    text_light: '#0369A1',  // cyan-700
    text_dark: '#075985',   // cyan-800
    bg: '#CFFAFE',          // cyan-100
    bg_light: '#A5F3FC',    // cyan-200
    border: '#67E8F9',      // cyan-300
    icon: '#0284C7',
  },
  
  // Muted - ซ่อนเสียง สีเทาอ่อน
  muted: {
    text: '#9CA3AF',        // gray-400
    text_light: '#6B7280',  // gray-500
    text_dark: '#4B5563',   // gray-600
    bg: '#F9FAFB',          // gray-50
    bg_light: '#F3F4F6',    // gray-100
    border: '#E5E7EB',      // gray-200
    icon: '#9CA3AF',
  },
} as const;

// ============================================
// KPI VALUE PRIORITY MAPPING
// ============================================

export const KPI_VALUE_PRIORITIES = {
  // Target values
  'target_critical': 'critical',      // Target วิกฤติ
  'target_high': 'high',             // Target สูง
  'target_medium': 'medium',         // Target กลาง
  'target_low': 'low',              // Target ต่ำ
  'target_met': 'success',          // Target บรรลุ
  'target_missed': 'negative',      // Target ไม่บรรลุ
  
  // Performance values
  'excellent': 'success',            // ยอดเยี่ยม
  'good': 'positive',               // ดี
  'average': 'neutral',             // ปานกลาง
  'below_average': 'warning',       // ต่ำกว่าปานกลาง
  'poor': 'negative',              // แย่
  'critical_performance': 'critical', // วิกฤติ
  
  // Diff values
  'positive_diff': 'positive',      // Diff บวก (ดีขึ้น)
  'negative_diff': 'negative',      // Diff ลบ (แย่ลง)
  'neutral_diff': 'neutral',        // Diff เป็น 0
  'significant_diff': 'highlight',   // Diff สำคัญมาก
  
  // Status values
  'over_target': 'success',        // เกิน Target
  'under_target': 'warning',        // ต่ำกว่า Target
  'on_target': 'positive',          // ตรง Target
  'far_from_target': 'critical',    // ห่างจาก Target มาก
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getTextPriorityColor = (priority: TextPriority) => TEXT_PRIORITY_COLORS[priority];

export const getKpiValuePriorityColor = (valueType: string) => {
  const priority = KPI_VALUE_PRIORITIES[valueType] || 'neutral';
  return TEXT_PRIORITY_COLORS[priority];
};

// ============================================
// TEXT PRIORITY CLASSES
// ============================================

export const getTextPriorityClasses = (priority: TextPriority) => {
  const colors = TEXT_PRIORITY_COLORS[priority];
  
  return {
    // Text classes
    text: `text-[${colors.text}]`,
    textLight: `text-[${colors.text_light}]`,
    textDark: `text-[${colors.text_dark}]`,
    
    // Background classes
    bg: `bg-[${colors.bg}]`,
    bgLight: `bg-[${colors.bg_light}]`,
    bgDark: `bg-[${colors.bg_dark}]`,
    
    // Border classes
    border: `border-[${colors.border}]`,
    borderLight: `border-[${colors.border}]`,
    borderDark: `border-[${colors.border}]`,
    
    // Icon classes
    icon: `text-[${colors.icon}]`,
    
    // Badge classes
    badge: `bg-[${colors.bg}] text-[${colors.text}] border-[${colors.border}]`,
    badgeSolid: `bg-[${colors.text}] text-white`,
    
    // Highlight classes
    highlight: `bg-[${colors.bg}] text-[${colors.text}]`,
    highlightSolid: `bg-[${colors.text}] text-white`,
    
    // Input classes
    input: `bg-[${colors.bg}] border-[${colors.border}] text-[${colors.text}]`,
    inputFocus: `focus:border-[${colors.text_light}] focus:ring-[${colors.text_light}]`,
  };
};

// ============================================
// VALUE FORMATTING WITH PRIORITY
// ============================================

export const formatValueWithPriority = (
  value: number,
  priority: TextPriority,
  options?: {
    prefix?: string;
    suffix?: string;
    decimals?: number;
    showIcon?: boolean;
    showBg?: boolean;
    showBorder?: boolean;
  }
) => {
  const colors = TEXT_PRIORITY_COLORS[priority];
  const classes = getTextPriorityClasses(priority);
  
  const formatted = value.toLocaleString('th-TH', {
    minimumFractionDigits: options?.decimals || 0,
    maximumFractionDigits: options?.decimals || 0,
  });
  
  const prefix = options?.prefix || '';
  const suffix = options?.suffix || '';
  
  return {
    value: `${prefix}${formatted}${suffix}`,
    color: colors.text,
    bgColor: colors.bg,
    borderColor: colors.border,
    classes: {
      text: classes.text,
      bg: classes.bg,
      border: classes.border,
      badge: options?.showBg ? classes.badge : classes.text,
      highlight: options?.showBg ? classes.highlight : classes.text,
    }
  };
};

// ============================================
// DIFF FORMATTING WITH PRIORITY
// ============================================

export const formatDiffWithPriority = (
  diff: number,
  options?: {
    showSign?: boolean;
    showArrow?: boolean;
    decimals?: number;
    threshold?: number; // threshold for significant diff
  }
) => {
  const threshold = options?.threshold || 5;
  const isPositive = diff > 0;
  const isNegative = diff < 0;
  const isSignificant = Math.abs(diff) >= threshold;
  
  let priority: TextPriority = 'neutral';
  
  if (isSignificant) {
    if (isPositive) priority = 'positive';
    if (isNegative) priority = 'negative';
  } else {
    if (isPositive) priority = 'positive';
    if (isNegative) priority = 'warning';
  }
  
  const colors = TEXT_PRIORITY_COLORS[priority];
  const classes = getTextPriorityClasses(priority);
  
  const sign = options?.showSign ? (isPositive ? '+' : '') : '';
  const arrow = options?.showArrow ? (isPositive ? '↑' : '↓') : '';
  
  const formatted = diff.toLocaleString('th-TH', {
    minimumFractionDigits: options?.decimals || 1,
    maximumFractionDigits: options?.decimals || 1,
  });
  
  return {
    value: `${sign}${formatted}${arrow}`,
    priority,
    color: colors.text,
    bgColor: colors.bg,
    borderColor: colors.border,
    classes: {
      text: classes.text,
      bg: classes.bg,
      border: classes.border,
      badge: classes.badge,
      highlight: classes.highlight,
    },
    isPositive,
    isNegative,
    isSignificant,
  };
};

// ============================================
// TARGET STATUS FORMATTING
// ============================================

export const formatTargetStatusWithPriority = (
  actual: number,
  target: number,
  options?: {
    decimals?: number;
    showPercentage?: boolean;
    showDiff?: boolean;
  }
) => {
  const achievement = target > 0 ? (actual / target) * 100 : 0;
  const diff = actual - target;
  
  let priority: TextPriority = 'neutral';
  let status: string = '';
  
  if (achievement >= 100) {
    priority = 'success';
    status = 'on_target';
  } else if (achievement >= 90) {
    priority = 'positive';
    status = 'near_target';
  } else if (achievement >= 70) {
    priority = 'warning';
    status = 'below_target';
  } else if (achievement >= 50) {
    priority = 'medium';
    status = 'far_from_target';
  } else {
    priority = 'critical';
    status = 'critical_performance';
  }
  
  const colors = TEXT_PRIORITY_COLORS[priority];
  const classes = getTextPriorityClasses(priority);
  
  const actualFormatted = actual.toLocaleString('th-TH', {
    minimumFractionDigits: options?.decimals || 0,
    maximumFractionDigits: options?.decimals || 0,
  });
  
  const targetFormatted = target.toLocaleString('th-TH', {
    minimumFractionDigits: options?.decimals || 0,
    maximumFractionDigits: options?.decimals || 0,
  });
  
  return {
    actual: actualFormatted,
    target: targetFormatted,
    achievement: achievement.toFixed(1),
    diff: diff.toFixed(1),
    priority,
    status,
    color: colors.text,
    bgColor: colors.bg,
    borderColor: colors.border,
    classes: {
      text: classes.text,
      bg: classes.bg,
      border: classes.border,
      badge: classes.badge,
      highlight: classes.highlight,
    },
    display: {
      actual: actualFormatted,
      target: targetFormatted,
      percentage: options?.showPercentage ? `${achievement.toFixed(1)}%` : undefined,
      diff: options?.showDiff ? diff.toFixed(1) : undefined,
    }
  };
};
