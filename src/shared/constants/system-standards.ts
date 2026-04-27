/**
 * System Standards
 * มาตรฐานระบบที่ใช้ทั่วทั้งแอปพลิเคชัน
 */

// ============================================
// SYSTEM DESIGN STANDARDS
// ============================================

export const SYSTEM_STANDARDS = {
  // ============================================
  // COLOR SYSTEM
  // ============================================
  colors: {
    // ใช้ Priority-based colors ทั้งระบบ
    usePriorityColors: true,
    
    // Category colors ตามความสำคัญ
    categories: {
      safety: 'critical',      // แดงเข้ม
      quality: 'high',         // เขียวเข้ม
      delivery: 'medium',      // ฟ้า
      compliance: 'warning',   // เหลือง
      hr: 'low',              // ม่วง
      attractive: 'info',      // ชมพู
      environment: 'success',  // เขียวอ่อน
      cost: 'error',          // ส้มเข้ม
    },
    
    // Text colors ตามความสำคัญ
    text: {
      critical: 'critical',    // ค่าวิกฤติ - แดงเข้ม
      high: 'high',           // ค่าสูง - ส้มเข้ม
      medium: 'medium',       // ค่ากลาง - ฟ้าเข้ม
      low: 'low',            // ค่าต่ำ - เขียวเข้ม
      positive: 'positive',   // ค่าบวก - เขียวสด
      negative: 'negative',   // ค่าลบ - แดงสด
      neutral: 'neutral',     // ค่าปกติ - เทาเข้ม
      muted: 'muted',         // ซ่อนเสียง - เทาอ่อน
    },
  },
  
  // ============================================
  // COMPONENT STANDARDS
  // ============================================
  components: {
    // ใช้ Priority components ทั้งระบบ
    usePriorityComponents: true,
    
    // Badge standards
    badges: {
      size: ['xs', 'sm', 'md', 'lg'],
      variant: ['solid', 'outline', 'subtle'],
      showIcon: true,
    },
    
    // Button standards
    buttons: {
      size: ['sm', 'md', 'lg'],
      variant: ['solid', 'outline', 'ghost'],
      priority: ['primary', 'secondary', 'danger'],
    },
    
    // Card standards
    cards: {
      padding: 'p-4',
      borderRadius: 'rounded-lg',
      border: 'border border-gray-200',
      shadow: 'shadow-sm hover:shadow-md',
    },
    
    // Table standards
    tables: {
      header: 'bg-gray-50',
      row: 'hover:bg-gray-50',
      cell: 'px-4 py-2',
      border: 'border-b border-gray-200',
    },
  },
  
  // ============================================
  // LAYOUT STANDARDS
  // ============================================
  layout: {
    // Page layout
    pages: {
      maxWidth: 'w-full',
      padding: 'p-6',
      spacing: 'space-y-6',
    },
    
    // Section layout
    sections: {
      padding: 'p-4',
      spacing: 'space-y-4',
      border: 'border border-gray-200 rounded-lg',
    },
    
    // Grid layout
    grids: {
      responsive: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
      gap: 'gap-4',
    },
  },
  
  // ============================================
  // TYPOGRAPHY STANDARDS
  // ============================================
  typography: {
    // Font sizes
    sizes: {
      xs: 'text-xs',
      sm: 'text-sm',
      base: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
      '2xl': 'text-2xl',
      '3xl': 'text-3xl',
    },
    
    // Font weights
    weights: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    
    // Text colors
    colors: {
      primary: 'text-gray-900',
      secondary: 'text-gray-700',
      muted: 'text-gray-500',
      disabled: 'text-gray-400',
    },
  },
  
  // ============================================
  // SPACING STANDARDS
  // ============================================
  spacing: {
    // Margin
    margin: {
      xs: 'm-1',
      sm: 'm-2',
      md: 'm-4',
      lg: 'm-6',
      xl: 'm-8',
    },
    
    // Padding
    padding: {
      xs: 'p-1',
      sm: 'p-2',
      md: 'p-4',
      lg: 'p-6',
      xl: 'p-8',
    },
    
    // Gap
    gap: {
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    },
  },
  
  // ============================================
  // ANIMATION STANDARDS
  // ============================================
  animations: {
    // Transitions
    transitions: {
      fast: 'transition-all duration-150',
      normal: 'transition-all duration-200',
      slow: 'transition-all duration-300',
    },
    
    // Hover effects
    hover: {
      scale: 'hover:scale-105',
      shadow: 'hover:shadow-md',
      color: 'hover:text-blue-600',
    },
    
    // Loading states
    loading: {
      spinner: 'animate-spin',
      pulse: 'animate-pulse',
      bounce: 'animate-bounce',
    },
  },
} as const;

// ============================================
// PAGE THEME STANDARDS
// ============================================

export const PAGE_THEMES = {
  // Yearly Targets Page
  yearly: {
    theme: 'gray',
    priority: 'neutral',
    colors: {
      header: 'bg-gray-50',
      accent: 'text-gray-600',
      primary: 'bg-gray-600',
      hover: 'hover:bg-gray-50',
    },
  },
  
  // Monthly Targets Page
  monthly_targets: {
    theme: 'blue',
    priority: 'medium',
    colors: {
      header: 'bg-blue-50',
      accent: 'text-blue-600',
      primary: 'bg-blue-600',
      hover: 'hover:bg-blue-50',
    },
  },
  
  // Monthly Results Page
  monthly_results: {
    theme: 'emerald',
    priority: 'low',
    colors: {
      header: 'bg-emerald-50',
      accent: 'text-emerald-600',
      primary: 'bg-emerald-600',
      hover: 'hover:bg-emerald-50',
    },
  },
} as const;

// ============================================
// COMPONENT MAPPING STANDARDS
// ============================================

export const COMPONENT_MAPPING = {
  // ใช้ PriorityText แทนข้อความทั่วไป
  text: 'PriorityText',
  
  // ใช้ PriorityValue แทนค่าตัวเลข
  value: 'PriorityValue',
  
  // ใช้ PriorityBadge แทน badge ทั่วไป
  badge: 'PriorityBadge',
  
  // ใช้ PriorityButton แทนปุ่มทั่วไป
  button: 'PriorityButton',
  
  // ใช้ PriorityCard แทนการ์ดทั่วไป
  card: 'PriorityCard',
  
  // ใช้ PriorityStatus แทนสถานะทั่วไป
  status: 'PriorityStatus',
} as const;

// ============================================
// UTILITY FUNCTIONS
// ============================================

export const getSystemStandard = (path: string) => {
  const keys = path.split('.');
  let value: any = SYSTEM_STANDARDS;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) return null;
  }
  
  return value;
};

export const getPageTheme = (page: keyof typeof PAGE_THEMES) => {
  return PAGE_THEMES[page];
};

export const getComponentMapping = (component: keyof typeof COMPONENT_MAPPING) => {
  return COMPONENT_MAPPING[component];
};

// ============================================
// VALIDATION RULES
// ============================================

export const VALIDATION_RULES = {
  // ต้องใช้ Priority components
  mustUsePriorityComponents: true,
  
  // ต้องใช้ Priority colors
  mustUsePriorityColors: true,
  
  // ต้องใช้มาตรฐาน spacing
  mustUseStandardSpacing: true,
  
  // ต้องใช้มาตรฐาน typography
  mustUseStandardTypography: true,
  
  // ห้ามใช้ค่าสี hardcoded
  noHardcodedColors: true,
  
  // ห้ามทำ components ซ้ำซ้อน
  noDuplicateComponents: true,
} as const;

// ============================================
// MIGRATION RULES
// ============================================

export const MIGRATION_RULES = {
  // แทนที่ hardcoded colors ด้วย priority colors
  replaceHardcodedColors: {
    '#DC2626': 'critical',
    '#EA580C': 'high',
    '#2563EB': 'medium',
    '#059669': 'low',
    '#6B7280': 'neutral',
    '#9CA3AF': 'muted',
  },
  
  // แทนที่ generic components ด้วย priority components
  replaceGenericComponents: {
    'span': 'PriorityText',
    'div': 'PriorityCard',
    'button': 'PriorityButton',
    'Badge': 'PriorityBadge',
  },
  
  // แทนที่ hardcoded styles ด้วย system standards
  replaceHardcodedStyles: {
    'text-sm font-medium': 'typography.weights.medium + typography.colors.secondary',
    'p-4 rounded-lg': 'components.cards.padding + components.cards.borderRadius',
    'hover:shadow-md': 'animations.hover.shadow',
  },
} as const;
