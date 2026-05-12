/**
 * System Standards Hook
 * Hook สำหรับใช้มาตรฐานระบบทั่วทั้งแอปพลิเคชัน
 */

import { useMemo } from 'react';
import {
  SYSTEM_STANDARDS,
  PAGE_THEMES,
  COMPONENT_MAPPING,
  getSystemStandard,
  getPageTheme,
  getComponentMapping,
} from '@/shared/constants/system-standards';
import { TextPriority } from '@/shared/constants/text-priority-colors';
import { PriorityLevel } from '@/shared/constants/priority-colors';

// ============================================
// SYSTEM STANDARDS HOOK
// ============================================

export function useSystemStandards() {
  const standards = useMemo(() => SYSTEM_STANDARDS, []);

  return {
    standards,
    getStandard: getSystemStandard,
    getPageTheme,
    getComponentMapping,
  };
}

// ============================================
// PAGE THEME HOOK
// ============================================

export function usePageTheme(pageName: keyof typeof PAGE_THEMES) {
  const theme = useMemo(() => getPageTheme(pageName), [pageName]);

  return {
    theme,
    colors: theme.colors,
    priority: theme.priority,
    themeName: theme.theme,
  };
}

// ============================================
// COMPONENT STYLES HOOK
// ============================================

export function useComponentStyles(component: keyof typeof SYSTEM_STANDARDS.components) {
  const styles = useMemo(() => {
    return getSystemStandard(`components.${component}`);
  }, [component]);

  return {
    styles,
    className: styles?.className || '',
    props: styles?.props || {},
  };
}

// ============================================
// PRIORITY STYLES HOOK
// ============================================

export function usePriorityStyles(priority: TextPriority | PriorityLevel) {
  const styles = useMemo(() => {
    const colorStandard = getSystemStandard(`colors.text.${priority}`);
    return colorStandard;
  }, [priority]);

  return {
    priority,
    styles,
    className: styles?.className || '',
  };
}

// ============================================
// LAYOUT STYLES HOOK
// ============================================

export function useLayoutStyles(layout: keyof typeof SYSTEM_STANDARDS.layout) {
  const styles = useMemo(() => {
    return getSystemStandard(`layout.${layout}`);
  }, [layout]);

  return {
    styles,
    className: styles?.className || '',
  };
}

// ============================================
// TYPOGRAPHY STYLES HOOK
// ============================================

export function useTypographyStyles(
  size?: keyof typeof SYSTEM_STANDARDS.typography.sizes,
  weight?: keyof typeof SYSTEM_STANDARDS.typography.weights,
  color?: keyof typeof SYSTEM_STANDARDS.typography.colors
) {
  const styles = useMemo(() => {
    const sizeClass = size ? getSystemStandard(`typography.sizes.${size}`) : '';
    const weightClass = weight ? getSystemStandard(`typography.weights.${weight}`) : '';
    const colorClass = color ? getSystemStandard(`typography.colors.${color}`) : '';

    return {
      size: sizeClass,
      weight: weightClass,
      color: colorClass,
      combined: [sizeClass, weightClass, colorClass].filter(Boolean).join(' '),
    };
  }, [size, weight, color]);

  return styles;
}

// ============================================
// SPACING STYLES HOOK
// ============================================

export function useSpacingStyles(
  type: 'margin' | 'padding' | 'gap',
  size?: keyof typeof SYSTEM_STANDARDS.spacing.margin
) {
  const styles = useMemo(() => {
    return getSystemStandard(`spacing.${type}.${size}`);
  }, [type, size]);

  return {
    className: styles || '',
  };
}

// ============================================
// ANIMATION STYLES HOOK
// ============================================

export function useAnimationStyles(type: keyof typeof SYSTEM_STANDARDS.animations) {
  const styles = useMemo(() => {
    return getSystemStandard(`animations.${type}`);
  }, [type]);

  return {
    className: styles || '',
  };
}

// ============================================
// VALIDATION HOOK
// ============================================

export function useSystemValidation() {
  const validateComponent = (componentName: string, props: any) => {
    const errors: string[] = [];

    // ตรวจสอบว่าใช้ Priority components หรือไม่ (ยกเว้น components ที่มีอยู่แล้ว)
    const legacyComponents = [
      'CatCard',
      'CompactDashboard',
      'OverviewSummaryCard',
      'QuickStatsCards',
      'CategorySummaryCards',
      'DepartmentBreakdownCards',
      'OverviewCharts',
      'CategoryCharts',
      'CategorySummaryTable',
    ];
    if (!componentName.includes('Priority') && !legacyComponents.includes(componentName)) {
      errors.push(`Component "${componentName}" should use Priority-based naming`);
    }

    // ตรวจสอบว่ามี priority prop หรือไม่
    if (!props.priority && componentName.includes('Priority')) {
      errors.push(`Component "${componentName}" should have a priority prop`);
    }

    // ตรวจสอบ legacy components ว่าใช้ unified color system หรือไม่
    if (legacyComponents.includes(componentName)) {
      // CatCard ควรใช้ useUnifiedColors hook
      if (componentName === 'CatCard' && !props.usesUnifiedColors) {
        errors.push(`Component "CatCard" should use useUnifiedColors hook`);
      }
    }

    // ตรวจสอบว่าใช้ hardcoded colors หรือไม่
    if (props.style && typeof props.style === 'object') {
      const styleString = JSON.stringify(props.style);
      const hardcodedColors = ['#DC2626', '#EA580C', '#2563EB', '#059669', '#6B7280'];

      hardcodedColors.forEach((color) => {
        if (styleString.includes(color)) {
          errors.push(`Component "${componentName}" should not use hardcoded color "${color}"`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  const validatePage = (pageName: string, components: any[]) => {
    const errors: string[] = [];
    const pageTheme = getPageTheme(pageName as keyof typeof PAGE_THEMES);

    if (!pageTheme) {
      errors.push(`Page "${pageName}" does not have a defined theme`);
    }

    components.forEach((component) => {
      const validation = validateComponent(component.name, component.props);
      if (!validation.isValid) {
        errors.push(...validation.errors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  return {
    validateComponent,
    validatePage,
  };
}

// ============================================
// MIGRATION HOOK
// ============================================

export function useSystemMigration() {
  const migrateColors = (oldColors: Record<string, string>) => {
    const migrated: Record<string, string> = {};

    Object.entries(oldColors).forEach(([key, value]) => {
      const migrationRules = {
        '#DC2626': 'critical',
        '#EA580C': 'high',
        '#2563EB': 'medium',
        '#059669': 'low',
        '#6B7280': 'neutral',
        '#9CA3AF': 'muted',
      };

      migrated[key] = migrationRules[value as keyof typeof migrationRules] || value;
    });

    return migrated;
  };

  const migrateComponents = (oldComponents: string[]) => {
    const migrated: string[] = [];

    oldComponents.forEach((component) => {
      const migrationRules = {
        span: 'PriorityText',
        div: 'PriorityCard',
        button: 'PriorityButton',
        Badge: 'PriorityBadge',
      };

      migrated.push(migrationRules[component as keyof typeof migrationRules] || component);
    });

    return migrated;
  };

  const migrateStyles = (oldStyles: string[]) => {
    const migrated: string[] = [];

    oldStyles.forEach((style) => {
      const migrationRules = {
        'text-sm font-medium': 'text-sm font-medium text-gray-700',
        'p-4 rounded-lg': 'p-4 rounded-lg border border-gray-200',
        'hover:shadow-md': 'transition-all duration-200 hover:shadow-md',
      };

      migrated.push(migrationRules[style as keyof typeof migrationRules] || style);
    });

    return migrated;
  };

  return {
    migrateColors,
    migrateComponents,
    migrateStyles,
  };
}

// ============================================
// SYSTEM CONFIG HOOK
// ============================================

export function useSystemConfig() {
  const config = useMemo(() => {
    return {
      // ตั้งค่าระบบทั่วไป
      app: {
        name: 'DENSO Company KPI',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
      },

      // ตั้งค่า UI
      ui: {
        theme: 'light',
        language: 'th',
        dateFormat: 'th-TH',
        currency: 'THB',
      },

      // ตั้งค่า KPI
      kpi: {
        defaultYear: new Date().getFullYear(),
        targetThreshold: 100,
        diffThreshold: 5,
        categories: [
          'safety',
          'quality',
          'delivery',
          'compliance',
          'hr',
          'attractive',
          'environment',
          'cost',
        ],
      },

      // ตั้งค่าการแสดงผล
      display: {
        itemsPerPage: 10,
        maxItemsPerPage: 50,
        defaultSort: 'name',
        defaultOrder: 'asc',
      },
    };
  }, []);

  return config;
}
