/**
 * APPROVAL ACTION BUTTONS
 * ปุ่มดำเนินการอนุมัติครบทุก flow: Submit, Approve, Reject, Return, Cancel
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Send,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Ban,
  RefreshCw,
  MessageSquare,
  Loader2,
  Shield,
  Users,
  UserCog,
} from 'lucide-react';
import type { ApprovalStatus, ApprovalLevel, ApprovalAction } from '@/shared/types/approval';
import { 
  APPROVAL_STATUS_CONFIG, 
  APPROVAL_ACTION_LABELS,
  canPerformAction 
} from '@/shared/constants/approval';
import { cn } from '@/lib/utils';

// ============================================
// PROPS
// ============================================

interface ApprovalActionButtonsProps {
  status: ApprovalStatus;
  userLevel: ApprovalLevel;
  isOwner?: boolean;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  layout?: 'horizontal' | 'vertical' | 'compact';
  className?: string;
  onSubmit?: () => void;
  onApprove?: () => void;
  onReject?: () => void;
  onReturn?: () => void;
  onCancel?: () => void;
  onResubmit?: () => void;
  onComment?: () => void;
}

// ============================================
// INDIVIDUAL ACTION BUTTON
// ============================================

interface ActionButtonProps {
  action: ApprovalAction;
  onClick: () => void;
  isLoading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
  className?: string;
  disabled?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  action,
  onClick,
  isLoading,
  size = 'md',
  variant = 'default',
  className,
  disabled,
}) => {
  const config = APPROVAL_ACTION_LABELS[action];

  const iconMap: Record<ApprovalAction, React.ComponentType<{ className?: string }>> = {
    submit: Send,
    approve: CheckCircle,
    reject: XCircle,
    return: ArrowLeft,
    cancel: Ban,
    resubmit: RefreshCw,
    delegate: UserCog,
    comment: MessageSquare,
  };

  const Icon = iconMap[action];

  // Variant styles based on action
  const variantStyles: Record<ApprovalAction, string> = {
    submit: 'bg-blue-600 hover:bg-blue-700 text-white',
    approve: 'bg-green-600 hover:bg-green-700 text-white',
    reject: 'bg-red-600 hover:bg-red-700 text-white',
    return: 'bg-amber-600 hover:bg-amber-700 text-white',
    cancel: 'bg-gray-600 hover:bg-gray-700 text-white',
    resubmit: 'bg-blue-600 hover:bg-blue-700 text-white',
    delegate: 'bg-purple-600 hover:bg-purple-700 text-white',
    comment: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  };

  // Size classes
  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    md: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (variant === 'outline') {
    return (
      <Button
        variant="outline"
        size={size}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(sizeClasses[size], className)}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin', iconSizes[size])} />
        ) : (
          <Icon className={iconSizes[size]} />
        )}
        <span className="ml-2">{config.labelTh}</span>
      </Button>
    );
  }

  if (variant === 'ghost') {
    return (
      <Button
        variant="ghost"
        size={size}
        onClick={onClick}
        disabled={disabled || isLoading}
        className={cn(sizeClasses[size], className)}
      >
        {isLoading ? (
          <Loader2 className={cn('animate-spin', iconSizes[size])} />
        ) : (
          <Icon className={cn(iconSizes[size], 'mr-2')} />
        )}
        {config.labelTh}
      </Button>
    );
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled || isLoading}
      className={cn(sizeClasses[size], variantStyles[action], className)}
    >
      {isLoading ? (
        <Loader2 className={cn('animate-spin', iconSizes[size])} />
      ) : (
        <Icon className={iconSizes[size]} />
      )}
      <span className="ml-2">{config.labelTh}</span>
    </Button>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const ApprovalActionButtons: React.FC<ApprovalActionButtonsProps> = ({
  status,
  userLevel,
  isOwner = false,
  isLoading = false,
  size = 'md',
  variant = 'default',
  layout = 'horizontal',
  className,
  onSubmit,
  onApprove,
  onReject,
  onReturn,
  onCancel,
  onResubmit,
  onComment,
}) => {
  // Calculate available actions
  const canSubmit = canPerformAction(status, 'submit', userLevel);
  const canApprove = canPerformAction(status, 'approve', userLevel) && !isOwner;
  const canReject = canPerformAction(status, 'reject', userLevel);
  const canReturn = canPerformAction(status, 'return', userLevel);
  const canCancel = canPerformAction(status, 'cancel', userLevel);
  const canResubmit = canPerformAction(status, 'submit', userLevel) && 
    (status === 'returned' || status.includes('rejected'));

  // Layout classes
  const layoutClasses = {
    horizontal: 'flex flex-wrap gap-2',
    vertical: 'flex flex-col gap-2',
    compact: 'flex gap-1',
  };

  return (
    <div className={cn(layoutClasses[layout], className)}>
      {/* Submit Button */}
      {canSubmit && !canResubmit && onSubmit && (
        <ActionButton
          action="submit"
          onClick={onSubmit}
          isLoading={isLoading}
          size={size}
          variant={variant}
        />
      )}

      {/* Resubmit Button */}
      {canResubmit && onResubmit && (
        <ActionButton
          action="resubmit"
          onClick={onResubmit}
          isLoading={isLoading}
          size={size}
          variant={variant}
        />
      )}

      {/* Approve Button */}
      {canApprove && onApprove && (
        <ActionButton
          action="approve"
          onClick={onApprove}
          isLoading={isLoading}
          size={size}
          variant={variant}
        />
      )}

      {/* Reject Button */}
      {canReject && onReject && (
        <ActionButton
          action="reject"
          onClick={onReject}
          isLoading={isLoading}
          size={size}
          variant={variant}
        />
      )}

      {/* Return Button */}
      {canReturn && onReturn && (
        <ActionButton
          action="return"
          onClick={onReturn}
          isLoading={isLoading}
          size={size}
          variant={variant}
        />
      )}

      {/* Cancel Button */}
      {canCancel && onCancel && (
        <ActionButton
          action="cancel"
          onClick={onCancel}
          isLoading={isLoading}
          size={size}
          variant={variant}
        />
      )}

      {/* Comment Button */}
      {onComment && (
        <ActionButton
          action="comment"
          onClick={onComment}
          isLoading={isLoading}
          size={size}
          variant="outline"
        />
      )}
    </div>
  );
};

// ============================================
// COMPACT VARIANT (Icon only)
// ============================================

export const CompactApprovalActions: React.FC<
  Omit<ApprovalActionButtonsProps, 'layout' | 'size' | 'variant'>
> = (props) => {
  return (
    <ApprovalActionButtons
      {...props}
      layout="compact"
      size="sm"
      variant="ghost"
    />
  );
};

// ============================================
// APPROVER LEVEL BADGE
// ============================================

export const ApproverLevelBadge: React.FC<{
  level: ApprovalLevel;
  className?: string;
}> = ({ level, className }) => {
  const levelConfig: Record<ApprovalLevel, { label: string; icon: React.ComponentType; color: string }> = {
    user: { label: 'ผู้บันทึก', icon: Send, color: 'bg-gray-100 text-gray-700' },
    hos: { label: 'Head of Section', icon: Shield, color: 'bg-blue-100 text-blue-700' },
    hod: { label: 'Head of Department', icon: Users, color: 'bg-purple-100 text-purple-700' },
    admin: { label: 'Administrator', icon: UserCog, color: 'bg-green-100 text-green-700' },
    superadmin: { label: 'Super Admin', icon: Shield, color: 'bg-red-100 text-red-700' },
  };

  const config = levelConfig[level];
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium', config.color, className)}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
};

export default ApprovalActionButtons;
