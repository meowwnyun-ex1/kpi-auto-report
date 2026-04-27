/**
 * Priority Text Components
 * แสดงข้อความและค่าตัวเลขที่สำคัญด้วยสีที่ชัดเจน
 */

import React from 'react';
import {
  TextPriority,
  TEXT_PRIORITY_COLORS,
  getTextPriorityClasses,
  formatValueWithPriority,
  formatDiffWithPriority,
  formatTargetStatusWithPriority,
} from '@/shared/constants/text-priority-colors';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Target } from 'lucide-react';

// ============================================
// PRIORITY TEXT COMPONENT
// ============================================

interface PriorityTextProps {
  priority: TextPriority;
  children: React.ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  variant?: 'text' | 'badge' | 'highlight' | 'solid';
  showIcon?: boolean;
  className?: string;
}

export function PriorityText({
  priority,
  children,
  size = 'md',
  weight = 'medium',
  variant = 'text',
  showIcon = false,
  className = '',
}: PriorityTextProps) {
  const colors = TEXT_PRIORITY_COLORS[priority];
  const classes = getTextPriorityClasses(priority);

  const sizeClasses = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
  }[size];

  const weightClasses = {
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
  }[weight];

  const getVariantClasses = () => {
    switch (variant) {
      case 'text':
        return classes.text;
      case 'badge':
        return `inline-flex items-center gap-1 px-2 py-1 rounded-md ${classes.badge}`;
      case 'highlight':
        return `inline-flex items-center gap-1 px-2 py-1 rounded-md ${classes.highlight}`;
      case 'solid':
        return `inline-flex items-center gap-1 px-2 py-1 rounded-md ${classes.badgeSolid}`;
      default:
        return classes.text;
    }
  };

  const getIcon = () => {
    if (!showIcon) return null;

    const iconMap = {
      critical: AlertTriangle,
      high: AlertTriangle,
      medium: Target,
      low: CheckCircle,
      positive: TrendingUp,
      negative: TrendingDown,
      neutral: Minus,
      highlight: Target,
      warning: AlertTriangle,
      success: CheckCircle,
      info: Target,
      muted: Minus,
    };

    const Icon = iconMap[priority];
    return Icon ? <Icon className="w-4 h-4" /> : null;
  };

  return (
    <span className={`${sizeClasses} ${weightClasses} ${getVariantClasses()} ${className}`}>
      {getIcon()}
      {children}
    </span>
  );
}

// ============================================
// PRIORITY VALUE COMPONENT
// ============================================

interface PriorityValueProps {
  value: number;
  priority?: TextPriority;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'text' | 'badge' | 'highlight';
  showIcon?: boolean;
  className?: string;
}

export function PriorityValue({
  value,
  priority = 'neutral',
  prefix,
  suffix,
  decimals = 0,
  size = 'md',
  variant = 'text',
  showIcon = false,
  className = '',
}: PriorityValueProps) {
  const formatted = formatValueWithPriority(value, priority, {
    prefix,
    suffix,
    decimals,
    showIcon,
    showBg: variant === 'badge' || variant === 'highlight',
  });

  return (
    <PriorityText
      priority={priority}
      size={size}
      variant={variant}
      showIcon={showIcon}
      className={className}>
      {formatted.value}
    </PriorityText>
  );
}

// ============================================
// PRIORITY DIFF COMPONENT
// ============================================

interface PriorityDiffProps {
  diff: number;
  showSign?: boolean;
  showArrow?: boolean;
  decimals?: number;
  threshold?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'text' | 'badge' | 'highlight';
  showIcon?: boolean;
  className?: string;
}

export function PriorityDiff({
  diff,
  showSign = true,
  showArrow = true,
  decimals = 1,
  threshold = 5,
  size = 'md',
  variant = 'text',
  showIcon = true,
  className = '',
}: PriorityDiffProps) {
  const formatted = formatDiffWithPriority(diff, {
    showSign,
    showArrow,
    decimals,
    threshold,
  });

  const getIcon = () => {
    if (!showIcon) return null;

    if (formatted.isPositive) return <TrendingUp className="w-4 h-4" />;
    if (formatted.isNegative) return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  return (
    <PriorityText
      priority={formatted.priority}
      size={size}
      variant={variant}
      showIcon={false}
      className={className}>
      {getIcon()}
      {formatted.value}
    </PriorityText>
  );
}

// ============================================
// PRIORITY TARGET STATUS COMPONENT
// ============================================

interface PriorityTargetStatusProps {
  actual: number;
  target: number;
  decimals?: number;
  showPercentage?: boolean;
  showDiff?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'text' | 'badge' | 'highlight';
  showIcon?: boolean;
  className?: string;
}

export function PriorityTargetStatus({
  actual,
  target,
  decimals = 0,
  showPercentage = true,
  showDiff = false,
  size = 'md',
  variant = 'text',
  showIcon = true,
  className = '',
}: PriorityTargetStatusProps) {
  const formatted = formatTargetStatusWithPriority(actual, target, {
    decimals,
    showPercentage,
    showDiff,
  });

  const getIcon = () => {
    if (!showIcon) return null;

    if (formatted.priority === 'success' || formatted.priority === 'positive') {
      return <CheckCircle className="w-4 h-4" />;
    }
    if (formatted.priority === 'critical' || formatted.priority === 'negative') {
      return <AlertTriangle className="w-4 h-4" />;
    }
    return <Target className="w-4 h-4" />;
  };

  return (
    <PriorityText
      priority={formatted.priority}
      size={size}
      variant={variant}
      showIcon={false}
      className={className}>
      {getIcon()}
      {showPercentage ? `${formatted.achievement}%` : `${formatted.actual}/${formatted.target}`}
      {showDiff && formatted.diff !== '0' && ` (${formatted.diff})`}
    </PriorityText>
  );
}

// ============================================
// PRIORITY TARGET VALUE COMPONENT
// ============================================

interface PriorityTargetValueProps {
  value: number;
  label?: string;
  priority?: TextPriority;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}

export function PriorityTargetValue({
  value,
  label,
  priority = 'neutral',
  size = 'md',
  showLabel = true,
  showIcon = false,
  className = '',
}: PriorityTargetValueProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <PriorityValue
        value={value}
        priority={priority}
        size={size}
        variant="text"
        showIcon={showIcon}
      />
      {showLabel && label && <span className="text-sm text-gray-500">{label}</span>}
    </div>
  );
}

// ============================================
// PRIORITY KPI CARD COMPONENT
// ============================================

interface PriorityKpiCardProps {
  title: string;
  value: number;
  target?: number;
  diff?: number;
  priority?: TextPriority;
  size?: 'sm' | 'md' | 'lg';
  showTarget?: boolean;
  showDiff?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export function PriorityKpiCard({
  title,
  value,
  target,
  diff,
  priority = 'neutral',
  size = 'md',
  showTarget = true,
  showDiff = true,
  showPercentage = true,
  className = '',
}: PriorityKpiCardProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[size];

  const valueSizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }[size];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${sizeClasses} ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        {target && showTarget && (
          <PriorityTargetStatus
            actual={value}
            target={target}
            size="sm"
            variant="badge"
            showIcon={false}
          />
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <PriorityValue
          value={value}
          priority={priority}
          size={valueSizeClasses as any}
          weight="bold"
        />

        {diff !== undefined && showDiff && (
          <PriorityDiff diff={diff} size="sm" variant="badge" showIcon={true} />
        )}
      </div>

      {target && showPercentage && (
        <div className="mt-2">
          <PriorityTargetStatus
            actual={value}
            target={target}
            size="xs"
            variant="text"
            showIcon={false}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// QUICK EXPORTS
// ============================================

export type { TextPriority } from '@/shared/constants/text-priority-colors';
export { TEXT_PRIORITY_COLORS } from '@/shared/constants/text-priority-colors';
