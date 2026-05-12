/**
 * APPROVAL STATUS BADGE
 * แสดงสถานะการอนุมัติพร้อมสีและไอคอนที่เหมาะสม
 */

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ArrowLeft, 
  Ban, 
  Search,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import type { ApprovalStatus } from '@/shared/types/approval';
import { APPROVAL_STATUS_CONFIG } from '@/shared/constants/approval';
import { cn } from '@/lib/utils';

// ============================================
// PROPS
// ============================================

interface ApprovalStatusBadgeProps {
  status: ApprovalStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  language?: 'en' | 'th';
  className?: string;
  pendingDays?: number;
}

// ============================================
// ICON MAP
// ============================================

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Ban,
  Search,
  ShieldCheck,
  AlertCircle,
};

// ============================================
// COMPONENT
// ============================================

export const ApprovalStatusBadge: React.FC<ApprovalStatusBadgeProps> = ({
  status,
  size = 'md',
  showIcon = true,
  language = 'th',
  className,
  pendingDays,
}) => {
  const config = APPROVAL_STATUS_CONFIG[status];
  const Icon = ICON_MAP[config.icon] || FileText;

  // Size variants
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  // Icon size
  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Show pending days for pending/reviewing statuses
  const showPendingDays = pendingDays !== undefined && 
    (status === 'pending' || status.includes('reviewing'));

  return (
    <Badge
      className={cn(
        'font-medium inline-flex items-center gap-1.5 transition-all',
        sizeClasses[size],
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
        borderColor: config.color,
      }}
      variant="outline"
    >
      {showIcon && <Icon className={iconSize[size]} />}
      <span>{language === 'th' ? config.labelTh : config.label}</span>
      {showPendingDays && (
        <span className="ml-1 opacity-75">
          ({pendingDays} วัน)
        </span>
      )}
    </Badge>
  );
};

// ============================================
// SIMPLIFIED VARIANT
// ============================================

export const SimpleApprovalBadge: React.FC<{
  status: ApprovalStatus;
  className?: string;
}> = ({ status, className }) => {
  const config = APPROVAL_STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        className
      )}
      style={{
        backgroundColor: config.bgColor,
        color: config.color,
      }}
    >
      {config.labelTh}
    </span>
  );
};

// ============================================
// DOT VARIANT
// ============================================

export const ApprovalStatusDot: React.FC<{
  status: ApprovalStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}> = ({ status, size = 'md', className }) => {
  const config = APPROVAL_STATUS_CONFIG[status];

  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  return (
    <span
      className={cn(
        'inline-block rounded-full',
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: config.color }}
      title={config.labelTh}
    />
  );
};

// ============================================
// WITH DESCRIPTION
// ============================================

export const ApprovalStatusWithDescription: React.FC<{
  status: ApprovalStatus;
  className?: string;
}> = ({ status, className }) => {
  const config = APPROVAL_STATUS_CONFIG[status];
  const Icon = ICON_MAP[config.icon] || FileText;

  return (
    <div className={cn('flex items-start gap-3', className)}>
      <div
        className="p-2 rounded-lg flex-shrink-0"
        style={{ backgroundColor: config.bgColor }}
      >
        <Icon className="w-5 h-5" style={{ color: config.color }} />
      </div>
      <div>
        <p className="font-medium" style={{ color: config.color }}>
          {config.labelTh}
        </p>
        <p className="text-sm text-muted-foreground">
          {config.description}
        </p>
      </div>
    </div>
  );
};

export default ApprovalStatusBadge;
