/**
 * Priority-Based Color System
 * ระบบสีที่อิงตามระดับความสำคัญเพื่อให้ผู้ใช้จัดลำดับความสำคัญได้
 */

// ============================================
// PRIORITY LEVELS
// ============================================

export type PriorityLevel =
  | 'critical' // ระดับวิกฤติ - สีแดงเข้ม
  | 'high' // ระดับสูง - สีส้ม/แดง
  | 'medium' // ระดับกลาง - สีเหลือง/ฟ้า
  | 'low' // ระดับต่ำ - สีเขียว/น้ำเงิน
  | 'info' // ข้อมูล - สีน้ำเงิน/ฟ้า
  | 'neutral' // ปกติ - สีเทา
  | 'success' // สำเร็จ - สีเขียว
  | 'warning' // เตือน - สีเหลือง/ส้ม
  | 'error' // ผิดพลาด - สีแดง
  | 'disabled'; // ปิดใช้งาน - สีเทาอ่อน

// ============================================
// PRIORITY COLOR PALETTES
// ============================================

export const PRIORITY_COLORS = {
  // Critical - สีแดงเข้มสำหรับเรื่องวิกฤติ
  critical: {
    // Main colors
    primary: '#DC2626', // red-600
    primary_light: '#EF4444', // red-500
    primary_dark: '#991B1B', // red-800

    // Background colors
    bg: '#FEE2E2', // red-100
    bg_light: '#FEE2E2', // red-100
    bg_dark: '#7F1D1D', // red-900

    // Text colors
    text: '#DC2626', // red-600
    text_light: '#991B1B', // red-800
    text_on_bg: '#991B1B', // red-800

    // Border colors
    border: '#FCA5A5', // red-300
    border_light: '#FCA5A5', // red-300
    border_dark: '#7F1D1D', // red-900

    // UI colors
    badge: '#DC2626', // red-600
    chip: '#DC2626', // red-600
    icon: '#DC2626', // red-600
    button: '#DC2626', // red-600
    button_hover: '#B91C1C', // red-700
  },

  // High - สีเขียวเข้มสำหรับเรื่องสำคัญสูง
  high: {
    primary: '#059669', // emerald-600
    primary_light: '#10B981', // emerald-500
    primary_dark: '#047857', // emerald-700

    bg: '#D1FAE5', // emerald-100
    bg_light: '#D1FAE5', // emerald-100
    bg_dark: '#064E3B', // emerald-900

    text: '#059669', // emerald-600
    text_light: '#047857', // emerald-700
    text_on_bg: '#065F46', // emerald-800

    border: '#6EE7B7', // emerald-300
    border_light: '#6EE7B7', // emerald-300
    border_dark: '#064E3B', // emerald-900

    badge: '#059669', // emerald-600
    chip: '#059669', // emerald-600
    icon: '#059669', // emerald-600
    button: '#059669', // emerald-600
    button_hover: '#047857', // emerald-700
  },

  // Medium - สีฟ้าสำหรับเรื่องความสำคัญปานกลาง
  medium: {
    primary: '#2563EB', // blue-600
    primary_light: '#3B82F6', // blue-500
    primary_dark: '#1D4ED8', // blue-700

    bg: '#DBEAFE', // blue-100
    bg_light: '#DBEAFE', // blue-100
    bg_dark: '#1E3A8A', // blue-900

    text: '#2563EB', // blue-600
    text_light: '#1D4ED8', // blue-700
    text_on_bg: '#1E40AF', // blue-800

    border: '#93C5FD', // blue-300
    border_light: '#93C5FD', // blue-300
    border_dark: '#1E3A8A', // blue-900

    badge: '#2563EB', // blue-600
    chip: '#2563EB', // blue-600
    icon: '#2563EB', // blue-600
    button: '#2563EB', // blue-600
    button_hover: '#1D4ED8', // blue-700
  },

  // Low - สีม่วงสำหรับเรื่องความสำคัญต่ำ
  low: {
    primary: '#9333EA', // purple-600
    primary_light: '#A855F7', // purple-500
    primary_dark: '#7C3AED', // purple-700

    bg: '#F3E8FF', // purple-100
    bg_light: '#F3E8FF', // purple-100
    bg_dark: '#4C1D95', // purple-900

    text: '#9333EA', // purple-600
    text_light: '#7C3AED', // purple-700
    text_on_bg: '#5B21B6', // purple-800

    border: '#D8B4FE', // purple-300
    border_light: '#D8B4FE', // purple-300
    border_dark: '#4C1D95', // purple-900

    badge: '#9333EA', // purple-600
    chip: '#9333EA', // purple-600
    icon: '#9333EA', // purple-600
    button: '#9333EA', // purple-600
    button_hover: '#7C3AED', // purple-700
  },

  // Info - สีชมพูสำหรับข้อมูลทั่วไป
  info: {
    primary: '#DB2777', // pink-600
    primary_light: '#EC4899', // pink-500
    primary_dark: '#BE185D', // pink-700

    bg: '#FDF2F8', // pink-100
    bg_light: '#FDF2F8', // pink-100
    bg_dark: '#831843', // pink-900

    text: '#DB2777', // pink-600
    text_light: '#BE185D', // pink-700
    text_on_bg: '#9F1239', // pink-800

    border: '#F9A8D4', // pink-300
    border_light: '#F9A8D4', // pink-300
    border_dark: '#831843', // pink-900

    badge: '#DB2777', // pink-600
    chip: '#DB2777', // pink-600
    icon: '#DB2777', // pink-600
    button: '#DB2777', // pink-600
    button_hover: '#BE185D', // pink-700
  },

  // Neutral - สีเทาสำหรับเรื่องทั่วไป
  neutral: {
    primary: '#6B7280', // gray-600
    primary_light: '#9CA3AF', // gray-400
    primary_dark: '#4B5563', // gray-700

    bg: '#F9FAFB', // gray-50
    bg_light: '#F9FAFB', // gray-50
    bg_dark: '#1F2937', // gray-800

    text: '#6B7280', // gray-600
    text_light: '#4B5563', // gray-700
    text_on_bg: '#374151', // gray-800

    border: '#E5E7EB', // gray-200
    border_light: '#F3F4F6', // gray-100
    border_dark: '#4B5563', // gray-700

    badge: '#6B7280', // gray-600
    chip: '#6B7280', // gray-600
    icon: '#6B7280', // gray-600
    button: '#6B7280', // gray-600
    button_hover: '#4B5563', // gray-700
  },

  // Success - สีเขียวอ่อนสำหรับความสำเร็จ
  success: {
    primary: '#84CC16', // lime-600
    primary_light: '#A3E635', // lime-500
    primary_dark: '#65A30D', // lime-700

    bg: '#F7FEE7', // lime-100
    bg_light: '#F7FEE7', // lime-100
    bg_dark: '#365314', // lime-900

    text: '#84CC16', // lime-600
    text_light: '#65A30D', // lime-700
    text_on_bg: '#4D7C0F', // lime-800

    border: '#BEF264', // lime-300
    border_light: '#BEF264', // lime-300
    border_dark: '#365314', // lime-900

    badge: '#84CC16', // lime-600
    chip: '#84CC16', // lime-600
    icon: '#84CC16', // lime-600
    button: '#84CC16', // lime-600
    button_hover: '#65A30D', // lime-700
  },

  // Warning - สีเหลืองสำหรับคำเตือน
  warning: {
    primary: '#D97706', // amber-600
    primary_light: '#F59E0B', // amber-500
    primary_dark: '#B45309', // amber-700

    bg: '#FEF3C7', // amber-100
    bg_light: '#FEF3C7', // amber-100
    bg_dark: '#78350F', // amber-900

    text: '#D97706', // amber-600
    text_light: '#B45309', // amber-700
    text_on_bg: '#92400E', // amber-800

    border: '#FCD34D', // amber-300
    border_light: '#FCD34D', // amber-300
    border_dark: '#78350F', // amber-900

    badge: '#D97706', // amber-600
    chip: '#D97706', // amber-600
    icon: '#D97706', // amber-600
    button: '#D97706', // amber-600
    button_hover: '#B45309', // amber-700
  },

  // Error - สีส้มเข้มสำหรับข้อผิดพลาด
  error: {
    primary: '#EA580C', // orange-600
    primary_light: '#F97316', // orange-500
    primary_dark: '#C2410C', // orange-700

    bg: '#FED7AA', // orange-100
    bg_light: '#FED7AA', // orange-100
    bg_dark: '#7C2D12', // orange-900

    text: '#EA580C', // orange-600
    text_light: '#C2410C', // orange-700
    text_on_bg: '#9A3412', // orange-800

    border: '#FDBA74', // orange-300
    border_light: '#FDBA74', // orange-300
    border_dark: '#7C2D12', // orange-900

    badge: '#EA580C', // orange-600
    chip: '#EA580C', // orange-600
    icon: '#EA580C', // orange-600
    button: '#EA580C', // orange-600
    button_hover: '#C2410C', // orange-700
  },

  // Disabled - สีเทาอ่อนสำหรับปิดใช้งาน
  disabled: {
    primary: '#D1D5DB', // gray-300
    primary_light: '#E5E7EB', // gray-200
    primary_dark: '#9CA3AF', // gray-400

    bg: '#F9FAFB', // gray-50
    bg_light: '#F9FAFB', // gray-50
    bg_dark: '#1F2937', // gray-800

    text: '#D1D5DB', // gray-300
    text_light: '#9CA3AF', // gray-400
    text_on_bg: '#6B7280', // gray-600

    border: '#E5E7EB', // gray-200
    border_light: '#F3F4F6', // gray-100
    border_dark: '#4B5563', // gray-700

    badge: '#D1D5DB', // gray-300
    chip: '#D1D5DB', // gray-300
    icon: '#D1D5DB', // gray-300
    button: '#D1D5DB', // gray-300
    button_hover: '#9CA3AF', // gray-400
  },
} as const;

// ============================================
// KPI CATEGORY PRIORITY MAPPING
// ============================================

export const KPI_CATEGORY_PRIORITIES: Record<string, PriorityLevel> = {
  safety: 'critical', // ความปลอดภัย - วิกฤติ (สีแดงเข้ม)
  quality: 'high', // คุณภาพ - สูง (สีเขียวเข้ม)
  delivery: 'medium', // การจัดส่ง - กลาง (สีฟ้า)
  compliance: 'warning', // ความสอดคล้อง - เตือน (สีเหลือง)
  hr: 'low', // ทรัพยากรบุคคล - ต่ำ (สีม่วง)
  attractive: 'info', // ความน่าดึงดูด - ข้อมูล (สีชมพู)
  environment: 'success', // สิ่งแวดล้อม - สำเร็จ (สีเขียวอ่อน)
  cost: 'error', // ต้นทุน - ผิดพลาด (สีส้มเข้ม)
};

// ============================================
// KPI STATUS PRIORITY MAPPING
// ============================================

export const KPI_STATUS_PRIORITIES: Record<string, PriorityLevel> = {
  // Target status
  not_set: 'neutral', // ยังไม่ตั้งค่า - ปกติ
  in_progress: 'medium', // กำลังดำเนินการ - กลาง
  completed: 'success', // เสร็จสิ้น - สำเร็จ
  overdue: 'warning', // เกินกำหนด - เตือน
  failed: 'error', // ล้มเหลว - ผิดพลาด

  // Performance status
  excellent: 'success', // ยอดเยี่ยม - สำเร็จ
  good: 'low', // ดี - ต่ำ
  average: 'medium', // ปานกลาง - กลาง
  below_average: 'warning', // ต่ำกว่าปานกลาง - เตือน
  poor: 'high', // แย่ - สูง
  critical: 'critical', // วิกฤติ - วิกฤติ
};

// ============================================
// PRIORITY UTILITY FUNCTIONS
// ============================================

export const getPriorityColor = (priority: PriorityLevel) => PRIORITY_COLORS[priority];

export const getCategoryPriorityColor = (categoryKey: string) => {
  const priority = KPI_CATEGORY_PRIORITIES[categoryKey] || 'neutral';
  return PRIORITY_COLORS[priority];
};

export const getStatusPriorityColor = (statusKey: string) => {
  const priority = KPI_STATUS_PRIORITIES[statusKey] || 'neutral';
  return PRIORITY_COLORS[priority];
};

// ============================================
// TAILWIND CLASS GENERATORS
// ============================================

export const getPriorityClasses = (priority: PriorityLevel) => {
  const colors = PRIORITY_COLORS[priority];

  return {
    // Text colors
    text: `text-[${colors.primary}]`,
    textLight: `text-[${colors.text_light}]`,
    textOnBg: `text-[${colors.text_on_bg}]`,

    // Background colors
    bg: `bg-[${colors.bg}]`,
    bgLight: `bg-[${colors.bg_light}]`,
    bgDark: `bg-[${colors.bg_dark}]`,

    // Border colors
    border: `border-[${colors.border}]`,
    borderLight: `border-[${colors.border_light}]`,
    borderDark: `border-[${colors.border_dark}]`,

    // UI components
    badge: `bg-[${colors.primary}] text-white`,
    chip: `bg-[${colors.bg}] text-[${colors.text}] border-[${colors.border}]`,
    icon: `text-[${colors.icon}]`,
    button: `bg-[${colors.button}] text-white hover:bg-[${colors.button_hover}]`,
    buttonOutline: `border-[${colors.border}] text-[${colors.text}] hover:bg-[${colors.bg}]`,

    // Card styles
    card: `border-[${colors.border}] bg-white`,
    cardHover: `hover:border-[${colors.primary_dark}] hover:shadow-md`,

    // Table styles
    tableHeader: `bg-[${colors.bg_light}]`,
    tableRow: `hover:bg-[${colors.bg}]`,
    tableCell: `border-[${colors.border_light}]`,
  };
};

// ============================================
// PRIORITY ORDER FOR SORTING
// ============================================

export const PRIORITY_ORDER: PriorityLevel[] = [
  'critical', // 1 - วิกฤติ
  'high', // 2 - สูง
  'medium', // 3 - กลาง
  'low', // 4 - ต่ำ
  'info', // 5 - ข้อมูล
  'neutral', // 6 - ปกติ
  'success', // 7 - สำเร็จ
  'warning', // 8 - เตือน
  'error', // 9 - ผิดพลาด
  'disabled', // 10 - ปิดใช้งาน
];

export const getPriorityWeight = (priority: PriorityLevel): number => {
  return PRIORITY_ORDER.indexOf(priority);
};

// ============================================
// LEGACY COMPATIBILITY
// ============================================

// Map existing colors to priority system for backward compatibility
export const LEGACY_COLOR_MAPPING = {
  // Safety -> Critical
  '#DC2626': 'critical',
  '#EF4444': 'critical',

  // Quality -> High
  '#16A34A': 'high',
  '#22C55E': 'high',

  // Delivery -> Medium
  '#2563EB': 'medium',
  '#3B82F6': 'medium',

  // Cost -> High
  '#4F46E5': 'high',
  '#6366F1': 'high',

  // HR -> Low
  '#EA580C': 'low',
  '#F97316': 'low',

  // Environment -> Medium
  '#0D9488': 'medium',
  '#14B8A6': 'medium',

  // Compliance -> High
  '#9333EA': 'high',
  '#A855F7': 'high',

  // Attractive -> Low
  '#DB2777': 'low',
  '#EC4899': 'low',
} as const;
