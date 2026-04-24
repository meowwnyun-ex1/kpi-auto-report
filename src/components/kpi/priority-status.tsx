/**
 * Priority Status Component
 * แสดงสถานะ KPI ด้วยระดับความสำคัญและสีที่เข้าใจง่าย
 */

import React from 'react';
import { PriorityBadge, PriorityChip, PriorityIndicator } from '@/components/ui/priority-badge';
import { KPI_STATUS_PRIORITIES, getStatusPriorityColor } from '@/constants/priority-colors';

interface PriorityStatusProps {
  status: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'badge' | 'chip' | 'indicator';
  showIcon?: boolean;
  className?: string;
}

// KPI Status Labels
const KPI_STATUS_LABELS = {
  // Target status
  not_set: 'Not Set',
  in_progress: 'In Progress', 
  completed: 'Completed',
  overdue: 'Overdue',
  failed: 'Failed',
  
  // Performance status
  excellent: 'Excellent',
  good: 'Good',
  average: 'Average',
  below_average: 'Below Average',
  poor: 'Poor',
  critical: 'Critical',
  
  // Action status
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  on_hold: 'On Hold',
  
  // General status
  active: 'Active',
  inactive: 'Inactive',
  archived: 'Archived',
  deleted: 'Deleted',
} as const;

export function PriorityStatus({
  status,
  label,
  size = 'md',
  variant = 'badge',
  showIcon = true,
  className = '',
}: PriorityStatusProps) {
  const priority = KPI_STATUS_PRIORITIES[status] || 'neutral';
  const displayLabel = label || KPI_STATUS_LABELS[status] || status;
  
  switch (variant) {
    case 'badge':
      return (
        <PriorityBadge
          priority={priority}
          label={displayLabel}
          size={size}
          showIcon={showIcon}
          className={className}
        />
      );
      
    case 'chip':
      return (
        <PriorityChip priority={priority} size={size} className={className}>
          <span>{displayLabel}</span>
        </PriorityChip>
      );
      
    case 'indicator':
      return (
        <PriorityIndicator priority={priority} size={size} className={className} />
      );
      
    default:
      return (
        <PriorityBadge
          priority={priority}
          label={displayLabel}
          size={size}
          showIcon={showIcon}
          className={className}
        />
      );
  }
}

// ============================================
// PRIORITY STATUS GRID
// ============================================

interface PriorityStatusGridProps {
  statuses: Array<{
    key: string;
    label?: string;
    value?: string | number;
    priority?: string;
  }>;
  columns?: number;
  className?: string;
}

export function PriorityStatusGrid({
  statuses,
  columns = 2,
  className = '',
}: PriorityStatusGridProps) {
  const gridClass = `grid gap-3 ${className}`.replace('grid', `grid-cols-${columns}`);

  return (
    <div className={gridClass}>
      {statuses.map((item) => {
        const priority = (item.priority as any) || KPI_STATUS_PRIORITIES[item.key] || 'neutral';
        const colors = getStatusPriorityColor(item.key);
        
        return (
          <div
            key={item.key}
            className="flex items-center justify-between p-3 rounded-lg border"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bg,
            }}
          >
            <span
              className="text-sm font-medium"
              style={{ color: colors.text }}
            >
              {item.label || KPI_STATUS_LABELS[item.key] || item.key}
            </span>
            {item.value !== undefined && (
              <span
                className="text-sm font-bold"
                style={{ color: colors.primary }}
              >
                {item.value}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// PRIORITY STATUS LIST
// ============================================

interface PriorityStatusListProps {
  statuses: Array<{
    key: string;
    label?: string;
    value?: string | number;
    description?: string;
    timestamp?: string;
  }>;
  className?: string;
}

export function PriorityStatusList({
  statuses,
  className = '',
}: PriorityStatusListProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {statuses.map((item) => {
        const priority = KPI_STATUS_PRIORITIES[item.key] || 'neutral';
        const colors = getStatusPriorityColor(item.key);
        
        return (
          <div
            key={item.key}
            className="flex items-start gap-3 p-3 rounded-lg border"
            style={{
              borderColor: colors.border,
              backgroundColor: colors.bg,
            }}
          >
            <PriorityIndicator priority={priority} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-sm font-medium"
                  style={{ color: colors.text }}
                >
                  {item.label || KPI_STATUS_LABELS[item.key] || item.key}
                </span>
                {item.value !== undefined && (
                  <span
                    className="text-sm font-bold"
                    style={{ color: colors.primary }}
                  >
                    {item.value}
                  </span>
                )}
              </div>
              {item.description && (
                <p
                  className="text-xs mt-1"
                  style={{ color: colors.text_light }}
                >
                  {item.description}
                </p>
              )}
              {item.timestamp && (
                <p
                  className="text-xs mt-1"
                  style={{ color: colors.text_light }}
                >
                  {item.timestamp}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// QUICK EXPORTS
// ============================================

export { KPI_STATUS_PRIORITIES, KPI_STATUS_LABELS } from '@/constants/priority-colors';
