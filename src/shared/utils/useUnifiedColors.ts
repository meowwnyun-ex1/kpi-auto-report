/**
 * Unified Color System Hook
 * ระบบสีที่เชื่อมต่อกับมาตรฐานระบบและจัดการสีทั่วทั้งแอปพลิเคชัน
 */

import { useMemo } from 'react';
import { useSystemStandards } from './useSystemStandards';
import { TextPriority } from '@/shared/constants/text-priority-colors';

// ============================================
// UNIFIED COLOR MAPPINGS
// ============================================

export const UNIFIED_COLOR_MAPPINGS = {
  // Performance percentage colors (standardized across all pages)
  performance: {
    zero: 'muted',           // 0% = gray
    excellent: 'success',    // 95%+ = emerald
    good: 'positive',       // 80-94% = green
    onTrack: 'medium',      // 60-79% = blue
    needsAttention: 'negative', // <60% = red
  },
  
  // Category priority colors (from system standards)
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
  
  // Status colors
  status: {
    noData: 'muted',
    excellent: 'success',
    good: 'positive',
    fair: 'medium',
    poor: 'negative',
    critical: 'critical',
  },
} as const;

// ============================================
// UNIFIED COLOR HOOK
// ============================================

export function useUnifiedColors() {
  const { getStandard } = useSystemStandards();
  
  // Get performance color based on percentage
  const getPerformanceColor = (percentage: number): TextPriority => {
    if (percentage === 0) return UNIFIED_COLOR_MAPPINGS.performance.zero;
    if (percentage >= 95) return UNIFIED_COLOR_MAPPINGS.performance.excellent;
    if (percentage >= 80) return UNIFIED_COLOR_MAPPINGS.performance.good;
    if (percentage >= 60) return UNIFIED_COLOR_MAPPINGS.performance.onTrack;
    return UNIFIED_COLOR_MAPPINGS.performance.needsAttention;
  };
  
  // Get category color
  const getCategoryColor = (categoryKey: string): TextPriority => {
    return UNIFIED_COLOR_MAPPINGS.categories[categoryKey as keyof typeof UNIFIED_COLOR_MAPPINGS.categories] || 'neutral';
  };
  
  // Get status color
  const getStatusColor = (status: keyof typeof UNIFIED_COLOR_MAPPINGS.status): TextPriority => {
    return UNIFIED_COLOR_MAPPINGS.status[status];
  };
  
  // Get performance badge info
  const getPerformanceBadge = (percentage: number) => {
    const color = getPerformanceColor(percentage);
    
    if (percentage === 0) {
      return {
        text: 'No Data',
        color: 'bg-gray-50 text-gray-500 border-gray-200',
        priority: color,
      };
    }
    
    if (percentage >= 95) {
      return {
        text: 'Excellent',
        color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        priority: color,
      };
    }
    
    if (percentage >= 80) {
      return {
        text: 'Good',
        color: 'bg-green-50 text-green-700 border-green-200',
        priority: color,
      };
    }
    
    if (percentage >= 60) {
      return {
        text: 'On Track',
        color: 'bg-blue-50 text-blue-700 border-blue-200',
        priority: color,
      };
    }
    
    return {
      text: 'Needs Work',
      color: 'bg-red-50 text-red-700 border-red-200',
      priority: color,
    };
  };
  
  // Get achievement circle colors
  const getAchievementCircleColors = (percentage: number) => {
    if (percentage === 0) {
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-500',
        border: 'border-white',
      };
    }
    
    if (percentage >= 95) {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-white',
      };
    }
    
    if (percentage >= 80) {
      return {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-white',
      };
    }
    
    if (percentage >= 60) {
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-white',
      };
    }
    
    return {
      bg: 'bg-red-50',
      text: 'text-red-700',
      border: 'border-white',
    };
  };
  
  // Validate color usage
  const validateColorUsage = (componentName: string, colors: string[]) => {
    const { validateComponent } = useSystemStandards();
    const validation = validateComponent(componentName, { priority: 'medium' });
    
    const hardcodedColors = ['#DC2626', '#EA580C', '#2563EB', '#059669', '#6B7280'];
    const issues: string[] = [];
    
    colors.forEach(color => {
      if (hardcodedColors.includes(color)) {
        issues.push(`Component "${componentName}" uses hardcoded color "${color}" - should use priority system`);
      }
    });
    
    if (!validation.isValid) {
      issues.push(...validation.errors);
    }
    
    return {
      isValid: issues.length === 0,
      issues,
    };
  };
  
  return {
    // Color getters
    getPerformanceColor,
    getCategoryColor,
    getStatusColor,
    
    // UI helpers
    getPerformanceBadge,
    getAchievementCircleColors,
    
    // Validation
    validateColorUsage,
    
    // System standards access
    getStandard,
    
    // Mappings
    mappings: UNIFIED_COLOR_MAPPINGS,
  };
}

// ============================================
// COLOR CONSISTENCY HOOK
// ============================================

export function useColorConsistency() {
  const { getPerformanceColor, validateColorUsage } = useUnifiedColors();
  
  // Ensure all components use same color logic
  const ensureConsistentColors = (components: Array<{name: string, colors: string[]}>) => {
    const issues: string[] = [];
    
    components.forEach(component => {
      const validation = validateColorUsage(component.name, component.colors);
      if (!validation.isValid) {
        issues.push(...validation.issues);
      }
    });
    
    return {
      isConsistent: issues.length === 0,
      issues,
    };
  };
  
  // Get standardized color class
  const getStandardizedColorClass = (percentage: number, type: 'text' | 'bg' | 'border' = 'text') => {
    const priority = getPerformanceColor(percentage);
    const colorMap = {
      muted: type === 'text' ? 'text-gray-500' : type === 'bg' ? 'bg-gray-50' : 'border-gray-200',
      success: type === 'text' ? 'text-emerald-700' : type === 'bg' ? 'bg-emerald-50' : 'border-emerald-200',
      positive: type === 'text' ? 'text-green-700' : type === 'bg' ? 'bg-green-50' : 'border-green-200',
      medium: type === 'text' ? 'text-blue-700' : type === 'bg' ? 'bg-blue-50' : 'border-blue-200',
      negative: type === 'text' ? 'text-red-700' : type === 'bg' ? 'bg-red-50' : 'border-red-200',
    };
    
    return colorMap[priority as keyof typeof colorMap] || colorMap.muted;
  };
  
  return {
    ensureConsistentColors,
    getStandardizedColorClass,
    getPerformanceColor,
  };
}
