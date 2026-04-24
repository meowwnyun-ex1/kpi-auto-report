/**
 * Priority Button Component
 * ปุ่มที่ใช้สีตามระดับความสำคัญ
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { PriorityLevel, PRIORITY_COLORS, getPriorityClasses } from '@/constants/priority-colors';
import { cn } from '@/lib/utils';

interface PriorityButtonProps {
  priority: PriorityLevel;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  onClick?: () => void;
}

export function PriorityButton({
  priority,
  children,
  size = 'md',
  variant = 'solid',
  disabled = false,
  loading = false,
  className = '',
  onClick,
}: PriorityButtonProps) {
  const colors = disabled ? PRIORITY_COLORS.disabled : PRIORITY_COLORS[priority];
  const priorityClasses = getPriorityClasses(priority);
  
  const getButtonClasses = () => {
    const baseClasses = 'relative transition-all duration-200';
    const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
    const loadingClasses = loading ? 'cursor-wait' : '';
    
    switch (variant) {
      case 'solid':
        return cn(
          baseClasses,
          disabledClasses,
          loadingClasses,
          `bg-[${colors.button}] text-white hover:bg-[${colors.button_hover}] border-transparent`,
          className
        );
        
      case 'outline':
        return cn(
          baseClasses,
          disabledClasses,
          loadingClasses,
          `border-[${colors.border}] text-[${colors.text}] bg-white hover:bg-[${colors.bg}]`,
          className
        );
        
      case 'ghost':
        return cn(
          baseClasses,
          disabledClasses,
          loadingClasses,
          `text-[${colors.text]} hover:bg-[${colors.bg}] border-transparent`,
          className
        );
        
      default:
        return cn(
          baseClasses,
          disabledClasses,
          loadingClasses,
          `bg-[${colors.button}] text-white hover:bg-[${colors.button_hover}] border-transparent`,
          className
        );
    }
  };

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base',
  }[size];

  return (
    <Button
      className={cn(getButtonClasses(), sizeClasses)}
      disabled={disabled}
      onClick={onClick}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : ''}>{children}</span>
    </Button>
  );
}

// ============================================
// PRIORITY ACTION BUTTONS
// ============================================

interface PriorityActionButtonsProps {
  onPrimary?: () => void;
  onSecondary?: () => void;
  onDanger?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
  dangerLabel?: string;
  primaryPriority?: PriorityLevel;
  secondaryPriority?: PriorityLevel;
  dangerPriority?: PriorityLevel;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function PriorityActionButtons({
  onPrimary,
  onSecondary,
  onDanger,
  primaryLabel = 'Save',
  secondaryLabel = 'Cancel',
  dangerLabel = 'Delete',
  primaryPriority = 'medium',
  secondaryPriority = 'neutral',
  dangerPriority = 'critical',
  disabled = false,
  loading = false,
  className = '',
}: PriorityActionButtonsProps) {
  return (
    <div className={cn('flex gap-2', className)}>
      {onSecondary && (
        <PriorityButton
          priority={secondaryPriority}
          variant="outline"
          onClick={onSecondary}
          disabled={disabled}
          className="flex-1"
        >
          {secondaryLabel}
        </PriorityButton>
      )}
      
      {onDanger && (
        <PriorityButton
          priority={dangerPriority}
          onClick={onDanger}
          disabled={disabled}
          loading={loading}
          className="flex-1"
        >
          {dangerLabel}
        </PriorityButton>
      )}
      
      {onPrimary && (
        <PriorityButton
          priority={primaryPriority}
          onClick={onPrimary}
          disabled={disabled}
          loading={loading}
          className={onSecondary || onDanger ? 'flex-1' : ''}
        >
          {primaryLabel}
        </PriorityButton>
      )}
    </div>
  );
}

// ============================================
// PRIORITY FAB (Floating Action Button)
// ============================================

interface PriorityFabProps {
  priority: PriorityLevel;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function PriorityFab({
  priority,
  children,
  onClick,
  disabled = false,
  className = '',
}: PriorityFabProps) {
  const colors = disabled ? PRIORITY_COLORS.disabled : PRIORITY_COLORS[priority];
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:shadow-xl',
        disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105',
        `bg-[${colors.button}] text-white`,
        className
      )}
    >
      {children}
    </button>
  );
}

// ============================================
// PRIORITY BUTTON GROUP
// ============================================

interface PriorityButtonGroupProps {
  buttons: Array<{
    priority: PriorityLevel;
    label: string;
    onClick: () => void;
    variant?: 'solid' | 'outline' | 'ghost';
    disabled?: boolean;
  }>;
  className?: string;
}

export function PriorityButtonGroup({
  buttons,
  className = '',
}: PriorityButtonGroupProps) {
  return (
    <div className={cn('flex gap-1', className)}>
      {buttons.map((button, index) => (
        <PriorityButton
          key={index}
          priority={button.priority}
          variant={button.variant || 'solid'}
          onClick={button.onClick}
          disabled={button.disabled}
          className="flex-1"
        >
          {button.label}
        </PriorityButton>
      ))}
    </div>
  );
}

// ============================================
// QUICK EXPORTS
// ============================================

export { PriorityLevel, PRIORITY_COLORS } from '@/constants/priority-colors';
