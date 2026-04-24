/**
 * Priority Badge Component
 * แสดงระดับความสำคัญด้วยสีและข้อความที่เข้าใจง่าย
 */

import React from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, Clock, Ban } from 'lucide-react';
import { PriorityLevel, PRIORITY_COLORS, getPriorityClasses } from '@/constants/priority-colors';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'subtle';
  showIcon?: boolean;
  className?: string;
}

const PRIORITY_ICONS = {
  critical: AlertTriangle,
  high: AlertTriangle,
  medium: Info,
  low: CheckCircle,
  info: Info,
  neutral: Info,
  success: CheckCircle,
  warning: Clock,
  error: XCircle,
  disabled: Ban,
} as const;

const PRIORITY_LABELS = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
  neutral: 'Normal',
  success: 'Success',
  warning: 'Warning',
  error: 'Error',
  disabled: 'Disabled',
} as const;

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
} as const;

export function PriorityBadge({
  priority,
  label,
  size = 'md',
  variant = 'solid',
  showIcon = true,
  className = '',
}: PriorityBadgeProps) {
  const colors = PRIORITY_COLORS[priority];
  const Icon = PRIORITY_ICONS[priority];
  const displayLabel = label || PRIORITY_LABELS[priority];
  const sizeClass = SIZE_CLASSES[size];

  const getVariantClasses = () => {
    switch (variant) {
      case 'solid':
        return `bg-[${colors.primary}] text-white`;
      case 'outline':
        return `border-[${colors.border}] text-[${colors.text}] bg-white`;
      case 'subtle':
        return `bg-[${colors.bg}] text-[${colors.text}] border-[${colors.border}]`;
      default:
        return `bg-[${colors.primary}] text-white`;
    }
  };

  const baseClasses = `inline-flex items-center gap-1.5 font-medium rounded-full transition-colors ${sizeClass} ${getVariantClasses()} ${className}`;

  return (
    <span className={baseClasses}>
      {showIcon && Icon && (
        <Icon className={`w-3 h-3 ${variant === 'solid' ? 'text-white' : 'text-current'}`} />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

// ============================================
// PRIORITY STATUS CHIP COMPONENT
// ============================================

interface PriorityChipProps {
  priority: PriorityLevel;
  children: React.ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}

export function PriorityChip({
  priority,
  children,
  size = 'md',
  className = '',
}: PriorityChipProps) {
  const colors = PRIORITY_COLORS[priority];
  const sizeClass = size === 'sm' ? 'text-xs px-2 py-1' : 'text-sm px-3 py-1.5';

  return (
    <span
      className={`inline-flex items-center gap-2 font-medium rounded-lg border ${sizeClass} bg-[${colors.bg}] text-[${colors.text}] border-[${colors.border}] ${className}`}
    >
      {children}
    </span>
  );
}

// ============================================
// PRIORITY CARD COMPONENT
// ============================================

interface PriorityCardProps {
  priority: PriorityLevel;
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function PriorityCard({
  priority,
  children,
  className = '',
  hover = true,
}: PriorityCardProps) {
  const colors = PRIORITY_COLORS[priority];
  const hoverClass = hover ? 'hover:shadow-md hover:border-[${colors.primary_dark}]' : '';

  return (
    <div
      className={`border rounded-xl bg-white ${hoverClass} ${className}`}
      style={{
        borderColor: colors.border,
        borderLeftWidth: '4px',
        borderLeftColor: colors.primary,
      }}
    >
      {children}
    </div>
  );
}

// ============================================
// PRIORITY INDICATOR COMPONENT
// ============================================

interface PriorityIndicatorProps {
  priority: PriorityLevel;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  className?: string;
}

export function PriorityIndicator({
  priority,
  size = 'md',
  pulse = false,
  className = '',
}: PriorityIndicatorProps) {
  const colors = PRIORITY_COLORS[priority];
  const Icon = PRIORITY_ICONS[priority];
  
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }[size];

  const pulseClass = pulse ? 'animate-pulse' : '';

  return (
    <div
      className={`inline-flex items-center justify-center rounded-full ${sizeClasses} ${pulseClass} ${className}`}
      style={{ backgroundColor: colors.primary }}
    >
      <Icon className="w-2/3 h-2/3 text-white" />
    </div>
  );
}

// ============================================
// PRIORITY TEXT COMPONENT
// ============================================

interface PriorityTextProps {
  priority: PriorityLevel;
  children: React.ReactNode;
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  className?: string;
}

export function PriorityText({
  priority,
  children,
  weight = 'medium',
  className = '',
}: PriorityTextProps) {
  const colors = PRIORITY_COLORS[priority];
  
  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }[weight];

  return (
    <span
      className={`${weightClasses} ${className}`}
      style={{ color: colors.text }}
    >
      {children}
    </span>
  );
}

// ============================================
// QUICK EXPORTS
// ============================================

export { PriorityLevel };
export { PRIORITY_COLORS, PRIORITY_LABELS, KPI_CATEGORY_PRIORITIES, KPI_STATUS_PRIORITIES } from '@/constants/priority-colors';
