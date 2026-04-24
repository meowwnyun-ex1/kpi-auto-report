/**
 * Priority Target Cell Component
 * แสดงค่า Target และ Diff ในตารางด้วยสีที่ชัดเจน
 */

import React from 'react';
import { PriorityValue, PriorityDiff, PriorityTargetStatus } from '@/components/ui/priority-text';
import { TextPriority } from '@/constants/text-priority-colors';

// ============================================
// TARGET VALUE CELL
// ============================================

interface TargetValueCellProps {
  value: number;
  priority?: TextPriority;
  decimals?: number;
  showIcon?: boolean;
  className?: string;
}

export function TargetValueCell({
  value,
  priority = 'neutral',
  decimals = 0,
  showIcon = false,
  className = '',
}: TargetValueCellProps) {
  return (
    <div className={`flex items-center justify-end ${className}`}>
      <PriorityValue
        value={value}
        priority={priority}
        decimals={decimals}
        size="sm"
        showIcon={showIcon}
        weight="medium"
      />
    </div>
  );
}

// ============================================
// TARGET DIFF CELL
// ============================================

interface TargetDiffCellProps {
  actual: number;
  target: number;
  showPercentage?: boolean;
  showArrow?: boolean;
  decimals?: number;
  className?: string;
}

export function TargetDiffCell({
  actual,
  target,
  showPercentage = true,
  showArrow = true,
  decimals = 1,
  className = '',
}: TargetDiffCellProps) {
  const diff = actual - target;
  const achievement = target > 0 ? (actual / target) * 100 : 0;
  
  let priority: TextPriority = 'neutral';
  
  if (achievement >= 100) {
    priority = 'success';
  } else if (achievement >= 90) {
    priority = 'positive';
  } else if (achievement >= 70) {
    priority = 'warning';
  } else if (achievement >= 50) {
    priority = 'medium';
  } else {
    priority = 'critical';
  }
  
  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {showPercentage && (
        <PriorityTargetStatus
          actual={actual}
          target={target}
          decimals={decimals}
          size="xs"
          variant="badge"
          showIcon={false}
        />
      )}
      <PriorityDiff
        diff={diff}
        showSign={true}
        showArrow={showArrow}
        decimals={decimals}
        size="xs"
        variant="badge"
        showIcon={false}
      />
    </div>
  );
}

// ============================================
// TARGET STATUS CELL
// ============================================

interface TargetStatusCellProps {
  actual: number;
  target: number;
  status: 'on_target' | 'near_target' | 'below_target' | 'far_from_target' | 'critical';
  showIcon?: boolean;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export function TargetStatusCell({
  actual,
  target,
  status,
  showIcon = true,
  size = 'sm',
  className = '',
}: TargetStatusCellProps) {
  const priorityMap = {
    on_target: 'success',
    near_target: 'positive',
    below_target: 'warning',
    far_from_target: 'medium',
    critical: 'critical',
  } as const;
  
  const priority = priorityMap[status];
  
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <PriorityTargetStatus
        actual={actual}
        target={target}
        size={size}
        variant="badge"
        showIcon={showIcon}
      />
    </div>
  );
}

// ============================================
// KPI TARGET ROW CELL
// ============================================

interface KpiTargetRowCellProps {
  measurement: string;
  target: number;
  actual?: number;
  diff?: number;
  priority?: TextPriority;
  showDiff?: boolean;
  showStatus?: boolean;
  className?: string;
}

export function KpiTargetRowCell({
  measurement,
  target,
  actual,
  diff,
  priority = 'neutral',
  showDiff = true,
  showStatus = false,
  className = '',
}: KpiTargetRowCellProps) {
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-sm text-gray-700">{measurement}</div>
      
      <div className="flex items-center justify-between gap-2">
        <TargetValueCell
          value={target}
          priority={priority}
          decimals={0}
          showIcon={false}
        />
        
        {actual !== undefined && showStatus && (
          <TargetStatusCell
            actual={actual}
            target={target}
            status={actual >= target ? 'on_target' : 'below_target'}
            showIcon={false}
            size="xs"
          />
        )}
        
        {diff !== undefined && showDiff && (
          <PriorityDiff
            diff={diff}
            showSign={true}
            showArrow={true}
            decimals={1}
            size="xs"
            variant="badge"
            showIcon={false}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// MONTHLY TARGET CELL
// ============================================

interface MonthlyTargetCellProps {
  month: string;
  target: number;
  actual?: number;
  yearlyTarget: number;
  showProgress?: boolean;
  className?: string;
}

export function MonthlyTargetCell({
  month,
  target,
  actual,
  yearlyTarget,
  showProgress = true,
  className = '',
}: MonthlyTargetCellProps) {
  const monthlyProgress = yearlyTarget > 0 ? (target / yearlyTarget) * 100 : 0;
  const achievement = target > 0 ? (actual || 0) / target * 100 : 0;
  
  let targetPriority: TextPriority = 'neutral';
  if (monthlyProgress >= 10) targetPriority = 'high';
  else if (monthlyProgress >= 8) targetPriority = 'medium';
  else if (monthlyProgress >= 5) targetPriority = 'low';
  
  let actualPriority: TextPriority = 'neutral';
  if (actual !== undefined) {
    if (achievement >= 100) actualPriority = 'success';
    else if (achievement >= 90) actualPriority = 'positive';
    else if (achievement >= 70) actualPriority = 'warning';
    else if (achievement >= 50) actualPriority = 'medium';
    else actualPriority = 'critical';
  }
  
  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-xs text-gray-500 font-medium">{month}</div>
      
      <div className="flex items-center justify-between gap-1">
        <TargetValueCell
          value={target}
          priority={targetPriority}
          decimals={0}
          showIcon={false}
        />
        
        {actual !== undefined && (
          <TargetValueCell
            value={actual}
            priority={actualPriority}
            decimals={0}
            showIcon={false}
          />
        )}
      </div>
      
      {showProgress && actual !== undefined && (
        <div className="w-full bg-gray-200 rounded-full h-1">
          <div
            className={`h-1 rounded-full transition-all duration-300 ${
              achievement >= 100 ? 'bg-green-500' :
              achievement >= 90 ? 'bg-blue-500' :
              achievement >= 70 ? 'bg-yellow-500' :
              achievement >= 50 ? 'bg-orange-500' : 'bg-red-500'
            }`}
            style={{ width: `${Math.min(achievement, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================
// TARGET SUMMARY CELL
// ============================================

interface TargetSummaryCellProps {
  title: string;
  value: number;
  target: number;
  diff?: number;
  trend?: 'up' | 'down' | 'stable';
  priority?: TextPriority;
  showTrend?: boolean;
  className?: string;
}

export function TargetSummaryCell({
  title,
  value,
  target,
  diff,
  trend,
  priority = 'neutral',
  showTrend = true,
  className = '',
}: TargetSummaryCellProps) {
  const achievement = target > 0 ? (value / target) * 100 : 0;
  
  let statusPriority: TextPriority = priority;
  if (achievement >= 100) statusPriority = 'success';
  else if (achievement >= 90) statusPriority = 'positive';
  else if (achievement >= 70) statusPriority = 'warning';
  else if (achievement >= 50) statusPriority = 'medium';
  else statusPriority = 'critical';
  
  return (
    <div className={`p-3 bg-white rounded-lg border ${className}`}>
      <div className="text-sm font-medium text-gray-700 mb-2">{title}</div>
      
      <div className="flex items-baseline justify-between gap-2">
        <PriorityValue
          value={value}
          priority={statusPriority}
          decimals={0}
          size="lg"
          weight="bold"
        />
        
        {diff !== undefined && (
          <PriorityDiff
            diff={diff}
            showSign={true}
            showArrow={true}
            decimals={1}
            size="sm"
            variant="badge"
            showIcon={false}
          />
        )}
      </div>
      
      <div className="mt-2 flex items-center justify-between gap-2">
        <PriorityTargetStatus
          actual={value}
          target={target}
          decimals={0}
          size="xs"
          variant="text"
          showIcon={false}
        />
        
        {showTrend && trend && (
          <PriorityDiff
            diff={trend === 'up' ? 1 : trend === 'down' ? -1 : 0}
            showSign={false}
            showArrow={true}
            decimals={0}
            size="xs"
            variant="text"
            showIcon={false}
          />
        )}
      </div>
    </div>
  );
}

// ============================================
// QUICK EXPORTS
// ============================================

export { TextPriority } from '@/constants/text-priority-colors';
