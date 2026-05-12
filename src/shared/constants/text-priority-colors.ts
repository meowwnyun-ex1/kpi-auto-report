/**
 * Text Priority Color System
 * ระบบสีสำหรับข้อความและค่าตัวเลขที่สำคัญ
 */

// ============================================
// TEXT PRIORITY LEVELS
// ============================================

export type TextPriority =
  | 'critical' // ค่าวิกฤติ - สีแดงเข้ม
  | 'high' // ค่าสูง - สีส้มเข้ม
  | 'medium' // ค่ากลาง - สีฟ้าเข้ม
  | 'low' // ค่าต่ำ - สีเขียวเข้ม
  | 'positive' // ค่าบวก/ดีขึ้น - สีเขียวสด
  | 'negative' // ค่าลบ/แย่ลง - สีแดงสด
  | 'neutral' // ค่าปกติ - สีเทาเข้ม
  | 'highlight' // เน้นพิเศษ - สีม่วงเข้ม
  | 'warning' // เตือน - สีเหลืองเข้ม
  | 'success' // สำเร็จ - สีเขียวเข้ม
  | 'info' // ข้อมูล - สีน้ำเงินเข้น
  | 'muted' // ซ่อนเสียง - สีเทาอ่อน
  | 'error'; // ข้อผิดพลาด - สีแดงสด

// ============================================
// TEXT PRIORITY COLORS
// ============================================

export const TEXT_PRIORITY_COLORS = {
  // Critical - ค่าวิกฤติ สีแดงเข้ม
  critical: {
    text: 'text-red-600', // red-600
    text_light: 'text-red-700', // red-700
    text_dark: 'text-red-800', // red-800
    bg: 'bg-red-100', // red-100
    bg_light: 'bg-red-200', // red-200
    bg_dark: 'bg-red-300', // red-300
    border: 'border-red-300', // red-300
    icon: 'text-red-600',
  },

  // High - ค่าสูง สีส้มเข้ม
  high: {
    text: 'text-orange-600', // orange-600
    text_light: 'text-orange-700', // orange-700
    text_dark: 'text-orange-800', // orange-800
    bg: 'bg-orange-100', // orange-100
    bg_light: 'bg-orange-200', // orange-200
    bg_dark: 'bg-orange-300', // orange-300
    border: 'border-orange-300', // orange-300
    icon: 'text-orange-600',
  },

  // Medium - ค่ากลาง สีฟ้าเข้ม
  medium: {
    text: 'text-blue-600', // blue-600
    text_light: 'text-blue-700', // blue-700
    text_dark: 'text-blue-800', // blue-800
    bg: 'bg-blue-100', // blue-100
    bg_light: 'bg-blue-200', // blue-200
    bg_dark: 'bg-blue-300', // blue-300
    border: 'border-blue-300', // blue-300
    icon: 'text-blue-600',
  },

  // Low - ค่าต่ำ สีเขียวเข้ม
  low: {
    text: 'text-emerald-600', // emerald-600
    text_light: 'text-emerald-700', // emerald-700
    text_dark: 'text-emerald-800', // emerald-800
    bg: 'bg-emerald-100', // emerald-100
    bg_light: 'bg-emerald-200', // emerald-200
    bg_dark: 'bg-emerald-300', // emerald-300
    border: 'border-emerald-300', // emerald-300
    icon: 'text-emerald-600',
  },

  // Positive - ค่าบวก/ดีขึ้น สีเขียวสด
  positive: {
    text: 'text-green-600', // green-600
    text_light: 'text-green-700', // green-700
    text_dark: 'text-green-800', // green-800
    bg: 'bg-green-100', // green-100
    bg_light: 'bg-green-200', // green-200
    bg_dark: 'bg-green-300', // green-300
    border: 'border-green-300', // green-300
    icon: 'text-green-600',
  },

  // Negative - ค่าลบ/แย่ลง สีแดงสด
  negative: {
    text: 'text-red-600', // red-600
    text_light: 'text-red-700', // red-700
    text_dark: 'text-red-800', // red-800
    bg: 'bg-red-100', // red-100
    bg_light: 'bg-red-200', // red-200
    bg_dark: 'bg-red-300', // red-300
    border: 'border-red-300', // red-300
    icon: 'text-red-600',
  },

  // Neutral - ค่าปกติ สีเทาเข้ม
  neutral: {
    text: 'text-gray-700', // gray-700
    text_light: 'text-gray-600', // gray-600
    text_dark: 'text-gray-800', // gray-800
    bg: 'bg-gray-100', // gray-100
    bg_light: 'bg-gray-200', // gray-200
    bg_dark: 'bg-gray-300', // gray-300
    border: 'border-gray-300', // gray-300
    icon: 'text-gray-600',
  },

  // Highlight - เน้นพิเศษ สีม่วงเข้ม
  highlight: {
    text: 'text-purple-600', // purple-600
    text_light: 'text-purple-700', // purple-700
    text_dark: 'text-purple-800', // purple-800
    bg: 'bg-purple-100', // purple-100
    bg_light: 'bg-purple-200', // purple-200
    bg_dark: 'bg-purple-300', // purple-300
    border: 'border-purple-300', // purple-300
    icon: 'text-purple-600',
  },

  // Warning - เตือน สีเหลืองเข้ม
  warning: {
    text: 'text-amber-600', // amber-600
    text_light: 'text-amber-700', // amber-700
    text_dark: 'text-amber-800', // amber-800
    bg: 'bg-amber-100', // amber-100
    bg_light: 'bg-amber-200', // amber-200
    bg_dark: 'bg-amber-300', // amber-300
    border: 'border-amber-300', // amber-300
    icon: 'text-amber-600',
  },

  // Success - สำเร็จ สีเขียวเข้ม
  success: {
    text: 'text-emerald-600', // emerald-600
    text_light: 'text-emerald-700', // emerald-700
    text_dark: 'text-emerald-800', // emerald-800
    bg: 'bg-emerald-100', // emerald-100
    bg_light: 'bg-emerald-200', // emerald-200
    bg_dark: 'bg-emerald-300', // emerald-300
    border: 'border-emerald-300', // emerald-300
    icon: 'text-emerald-600',
  },

  // Info - ข้อมูล สีน้ำเงินเข้น
  info: {
    text: 'text-cyan-600', // cyan-600
    text_light: 'text-cyan-700', // cyan-700
    text_dark: 'text-cyan-800', // cyan-800
    bg: 'bg-cyan-100', // cyan-100
    bg_light: 'bg-cyan-200', // cyan-200
    bg_dark: 'bg-cyan-300', // cyan-300
    border: 'border-cyan-300', // cyan-300
    icon: 'text-cyan-600',
  },

  // Muted - ซ่อนเสียง สีเทาอ่อน
  muted: {
    text: 'text-gray-400', // gray-400
    text_light: 'text-gray-500', // gray-500
    text_dark: 'text-gray-600', // gray-600
    bg: 'bg-gray-50', // gray-50
    bg_light: 'bg-gray-100', // gray-100
    bg_dark: 'bg-gray-200', // gray-200
    border: 'border-gray-200', // gray-200
    icon: 'text-gray-400',
  },

  // Error - ข้อผิดพลาด สีแดงสด
  error: {
    text: 'text-red-600', // red-600
    text_light: 'text-red-700', // red-700
    text_dark: 'text-red-800', // red-800
    bg: 'bg-red-100', // red-100
    bg_light: 'bg-red-200', // red-200
    bg_dark: 'bg-red-300', // red-300
    border: 'border-red-300', // red-300
    icon: 'text-red-600',
  },
} as const;

// ============================================
// KPI VALUE PRIORITY MAPPING
// ============================================

export const KPI_VALUE_PRIORITIES = {
  // Target values
  target_critical: 'critical', // Target วิกฤติ
  target_high: 'high', // Target สูง
  target_medium: 'medium', // Target กลาง
  target_low: 'low', // Target ต่ำ
  target_met: 'success', // Target บรรลุ
  target_missed: 'negative', // Target ไม่บรรลุ

  // Performance values
  excellent: 'success', // ยอดเยี่ยม
  good: 'positive', // ดี
  average: 'neutral', // ปานกลาง
  below_average: 'warning', // ต่ำกว่าปานกลาง
  poor: 'negative', // แย่
  critical_performance: 'critical', // วิกฤติ

  // Diff values
  positive_diff: 'positive', // Diff บวก (ดีขึ้น)
  negative_diff: 'negative', // Diff ลบ (แย่ลง)
  neutral_diff: 'neutral', // Diff เป็น 0
  significant_diff: 'highlight', // Diff สำคัญมาก

  // Status values
  over_target: 'success', // เกิน Target
  under_target: 'warning', // ต่ำกว่า Target
  on_target: 'positive', // ตรง Target
  far_from_target: 'critical', // ห่างจาก Target มาก
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getTextPriorityColor = (priority: TextPriority) => TEXT_PRIORITY_COLORS[priority];

export const getKpiValuePriorityColor = (valueType: string) => {
  const priority = (KPI_VALUE_PRIORITIES as Record<string, TextPriority>)[valueType] || 'neutral';
  return TEXT_PRIORITY_COLORS[priority as TextPriority];
};

// ============================================
// TEXT PRIORITY CLASSES
// ============================================

export const getTextPriorityClasses = (priority: TextPriority) => {
  const colors = TEXT_PRIORITY_COLORS[priority];

  return {
    // Text classes
    text: colors.text,
    textLight: colors.text_light,
    textDark: colors.text_dark,

    // Background classes
    bg: colors.bg,
    bgLight: colors.bg_light,
    bgDark: colors.bg_dark,

    // Border classes
    border: colors.border,
    borderLight: colors.border,
    borderDark: colors.border,

    // Icon classes
    icon: colors.icon,

    // Badge classes
    badge: `${colors.bg} ${colors.text} ${colors.border}`,
    badgeSolid: `${colors.text.replace('text-', 'bg-')} text-white`,

    // Highlight classes
    highlight: `${colors.bg} ${colors.text}`,
    highlightSolid: `${colors.text.replace('text-', 'bg-')} text-white`,

    // Input classes
    input: `${colors.bg} ${colors.border} ${colors.text}`,
    inputFocus: `focus:${colors.text_light.replace('text-', 'border-')} focus:ring-${colors.text_light.replace('text-', 'ring-')}`,
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
    },
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
    achievement: achievement.toFixed(2),
    diff: diff.toFixed(2),
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
      percentage: options?.showPercentage ? `${achievement.toFixed(2)}%` : undefined,
      diff: options?.showDiff ? diff.toFixed(2) : undefined,
    },
  };
};
