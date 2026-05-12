/**
 * Enterprise Badge Component
 * World-class professional badge with multiple variants and states
 */

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

// ============================================
// BADGE VARIANTS
// ============================================

const badgeVariants = cva(
  // Base styles - enterprise-grade foundation
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        // Default badge
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        
        // Secondary badge
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        
        // Outline badge
        outline: 'text-foreground border-border',
        
        // Destructive badge
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        
        // Success badge
        success: 'border-transparent bg-emerald-600 text-white hover:bg-emerald-700',
        
        // Warning badge
        warning: 'border-transparent bg-amber-600 text-white hover:bg-amber-700',
        
        // Info badge
        info: 'border-transparent bg-blue-600 text-white hover:bg-blue-700',
        
        // Purple badge
        purple: 'border-transparent bg-purple-600 text-white hover:bg-purple-700',
        
        // Gray badge
        gray: 'border-transparent bg-gray-600 text-white hover:bg-gray-700',
        
        // Gradient badge
        gradient: 'border-transparent bg-gradient-to-r from-primary to-primary/80 text-white',
      },
      size: {
        // Extra small
        xs: 'px-1.5 py-0.5 text-[10px]',
        
        // Small
        sm: 'px-2 py-0.5 text-xs',
        
        // Default
        default: 'px-2.5 py-0.5 text-xs',
        
        // Large
        lg: 'px-3 py-1 text-sm',
        
        // Extra large
        xl: 'px-4 py-1.5 text-base',
      },
      shape: {
        // Rounded (default)
        rounded: 'rounded-full',
        
        // Square
        square: 'rounded-sm',
        
        // Pill
        pill: 'rounded-full',
        
        // Rounded medium
        rounded_md: 'rounded-md',
      },
      interactive: {
        true: 'cursor-pointer hover:scale-105 active:scale-95',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'rounded',
      interactive: false,
    },
  }
);

// ============================================
// BADGE PROPS
// ============================================

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  removable?: boolean;
  onRemove?: () => void;
  pulse?: boolean;
  dot?: boolean;
}

// ============================================
// BADGE COMPONENT
// ============================================

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ 
    className, 
    variant, 
    size, 
    shape,
    interactive,
    leftIcon,
    rightIcon,
    removable = false,
    onRemove,
    pulse = false,
    dot = false,
    children, 
    ...props 
  }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant, size, shape, interactive }), className)}
        {...props}
      >
        {/* Pulse animation */}
        {pulse && (
          <span className="absolute inset-0 rounded-full animate-ping bg-current opacity-20" />
        )}
        
        {/* Left icon */}
        {leftIcon && (
          <span className="mr-1 shrink-0">{leftIcon}</span>
        )}
        
        {/* Dot indicator */}
        {dot && (
          <span className="mr-1.5 h-2 w-2 rounded-full bg-current" />
        )}
        
        {/* Badge content */}
        <span className="truncate">{children}</span>
        
        {/* Right icon */}
        {rightIcon && !removable && (
          <span className="ml-1 shrink-0">{rightIcon}</span>
        )}
        
        {/* Remove button */}
        {removable && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 rounded-full hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-black/20"
            aria-label="Remove badge"
          >
            <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

Badge.displayName = 'Badge';

// ============================================
// SPECIALIZED BADGE COMPONENTS
// ============================================

// Status badge
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'online' | 'offline' | 'away' | 'busy' | 'invisible';
  showLabel?: boolean;
}

const statusVariants = {
  online: 'success',
  offline: 'gray',
  away: 'warning',
  busy: 'destructive',
  invisible: 'secondary',
} as const;

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ status, showLabel = true, className, ...props }, ref) => {
    const variant = statusVariants[status];
    const labels = {
      online: 'Online',
      offline: 'Offline',
      away: 'Away',
      busy: 'Busy',
      invisible: 'Invisible',
    };

    return (
      <Badge
        ref={ref}
        variant={variant}
        dot={!showLabel}
        pulse={status === 'online'}
        className={className}
        {...props}
      >
        {showLabel && labels[status]}
      </Badge>
    );
  }
);

StatusBadge.displayName = 'StatusBadge';

// Priority badge
export interface PriorityBadgeProps extends Omit<BadgeProps, 'variant'> {
  priority: 'critical' | 'high' | 'medium' | 'low';
  showLabel?: boolean;
}

const priorityVariants = {
  critical: 'destructive',
  high: 'warning',
  medium: 'info',
  low: 'secondary',
} as const;

const PriorityBadge = React.forwardRef<HTMLDivElement, PriorityBadgeProps>(
  ({ priority, showLabel = true, className, ...props }, ref) => {
    const variant = priorityVariants[priority];
    const labels = {
      critical: 'Critical',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };

    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn('font-medium', className)}
        {...props}
      >
        {showLabel && labels[priority]}
      </Badge>
    );
  }
);

PriorityBadge.displayName = 'PriorityBadge';

// Approval status badge
export interface ApprovalBadgeProps extends Omit<BadgeProps, 'variant'> {
  status: 'draft' | 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';
  showLabel?: boolean;
}

const approvalVariants = {
  draft: 'gray',
  pending: 'warning',
  under_review: 'info',
  approved: 'success',
  rejected: 'destructive',
  cancelled: 'secondary',
} as const;

const ApprovalBadge = React.forwardRef<HTMLDivElement, ApprovalBadgeProps>(
  ({ status, showLabel = true, className, ...props }, ref) => {
    const variant = approvalVariants[status];
    const labels = {
      draft: 'Draft',
      pending: 'Pending',
      under_review: 'Under Review',
      approved: 'Approved',
      rejected: 'Rejected',
      cancelled: 'Cancelled',
    };

    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn('font-medium', className)}
        {...props}
      >
        {showLabel && labels[status]}
      </Badge>
    );
  }
);

ApprovalBadge.displayName = 'ApprovalBadge';

// Achievement badge
export interface AchievementBadgeProps extends Omit<BadgeProps, 'variant'> {
  achievement: number;
  target?: number;
  showPercentage?: boolean;
}

const getAchievementVariant = (achievement: number, target: number = 100) => {
  const percentage = (achievement / target) * 100;
  if (percentage >= 100) return 'success';
  if (percentage >= 90) return 'info';
  if (percentage >= 75) return 'warning';
  return 'destructive';
};

const AchievementBadge = React.forwardRef<HTMLDivElement, AchievementBadgeProps>(
  ({ achievement, target = 100, showPercentage = true, className, ...props }, ref) => {
    const variant = getAchievementVariant(achievement, target);
    const percentage = Math.round((achievement / target) * 100);

    return (
      <Badge
        ref={ref}
        variant={variant}
        className={cn('font-mono', className)}
        {...props}
      >
        {showPercentage ? `${percentage}%` : `${achievement}/${target}`}
      </Badge>
    );
  }
);

AchievementBadge.displayName = 'AchievementBadge';

// Category badge (for KPI categories)
export interface CategoryBadgeProps extends Omit<BadgeProps, 'variant'> {
  category: 'safety' | 'quality' | 'delivery' | 'cost' | 'hr' | 'environment' | 'compliance' | 'attractive';
  showIcon?: boolean;
}

const categoryVariants = {
  safety: 'destructive',
  quality: 'success',
  delivery: 'info',
  cost: 'warning',
  hr: 'purple',
  environment: 'info',
  compliance: 'secondary',
  attractive: 'purple',
} as const;

const categoryIcons = {
  safety: '⚠️',
  quality: '✓',
  delivery: '📦',
  cost: '💰',
  hr: '👥',
  environment: '🌱',
  compliance: '⚖️',
  attractive: '✨',
} as const;

const CategoryBadge = React.forwardRef<HTMLDivElement, CategoryBadgeProps>(
  ({ category, showIcon = false, className, ...props }, ref) => {
    const variant = categoryVariants[category];
    const icon = categoryIcons[category];

    return (
      <Badge
        ref={ref}
        variant={variant}
        leftIcon={showIcon ? icon : undefined}
        className={cn('capitalize', className)}
        {...props}
      >
        {category.replace('_', ' ')}
      </Badge>
    );
  }
);

CategoryBadge.displayName = 'CategoryBadge';

// Count badge (for notifications, etc.)
export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
  showZero?: boolean;
}

const CountBadge = React.forwardRef<HTMLDivElement, CountBadgeProps>(
  ({ count, max = 99, showZero = false, className, ...props }, ref) => {
    if (count === 0 && !showZero) return null;

    const displayCount = count > max ? `${max}+` : count.toString();

    return (
      <Badge
        ref={ref}
        variant="destructive"
        size="xs"
        className={cn('min-w-[1.25rem] h-5 flex items-center justify-center p-0 text-xs font-bold', className)}
        {...props}
      >
        {displayCount}
      </Badge>
    );
  }
);

CountBadge.displayName = 'CountBadge';

export { 
  Badge, 
  badgeVariants,
  StatusBadge,
  PriorityBadge,
  ApprovalBadge,
  AchievementBadge,
  CategoryBadge,
  CountBadge,
};
