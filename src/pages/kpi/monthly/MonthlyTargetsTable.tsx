import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Target,
  CalendarDays,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  Check,
  Minus,
  X,
} from 'lucide-react';
import { TABLE_COLORS } from '@/shared/constants/colors';
import { TableContainer } from '@/shared/components/TableContainer';
import { MONTHS } from '../shared';
import { YearlyTarget } from '../shared';
import { kpiNotifications } from '@/shared/constants/notifications';
import { useToast } from '@/shared/hooks/use-toast';
import { ApiService } from '@/services/api-service';

interface MonthlyTargetsTableProps {
  filteredYearlyTargets: YearlyTarget[];
  loading: boolean;
  canEdit: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  getMonthlyTarget: (yearlyTargetId: number, month: number) => any;
  getTargetStatus: (yearlyTargetId: number, month: number) => any;
  saveMonthlyTarget: (
    yearlyTargetId: number,
    month: number,
    target: number,
    comment?: string,
    toast?: any
  ) => void;
  fillAllMonths: (yearlyTargetId: number, target: number, toast: any) => void;
  toast: any;
  onRefreshData?: () => void;
}

const handleApprove = async (
  id: number,
  level: 'hos' | 'hod',
  toast: any,
  onRefreshData?: () => void
) => {
  try {
    const res = await ApiService.post<any>(`/approval/monthly/${id}/approve`, { level });
    if (res?.success !== false) {
      toast({
        title: 'Success',
        description: `Approved by ${level === 'hos' ? 'HoS' : 'HoD'}`,
      });
      onRefreshData?.();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to approve',
        variant: 'destructive',
      });
    }
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Error approving',
      variant: 'destructive',
    });
  }
};

const handleReject = async (
  id: number,
  level: 'hos' | 'hod',
  toast: any,
  onRefreshData?: () => void
) => {
  const comments = prompt('Please provide rejection reason:');
  if (!comments) return;

  try {
    const res = await ApiService.post<any>(`/approval/monthly/${id}/reject`, { level, comments });
    if (res?.success !== false) {
      toast({
        title: 'Success',
        description: 'Rejected successfully',
      });
      onRefreshData?.();
    } else {
      toast({
        title: 'Error',
        description: 'Failed to reject',
        variant: 'destructive',
      });
    }
  } catch (error) {
    toast({
      title: 'Error',
      description: 'Error rejecting',
      variant: 'destructive',
    });
  }
};

const ApprovalStatusBadge = ({ status }: { status?: string }) => {
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'text-gray-600 bg-gray-100' },
    hos_approved: { label: 'HoS Approved', color: 'text-blue-600 bg-blue-100' },
    hod_approved: { label: 'HoD Approved', color: 'text-purple-600 bg-purple-100' },
    approved: { label: 'Approved', color: 'text-green-600 bg-green-100' },
    rejected: { label: 'Rejected', color: 'text-red-600 bg-red-100' },
  };

  const config = statusConfig[status || 'pending'] || statusConfig.pending;
  return <Badge className={config.color}>{config.label}</Badge>;
};

export function MonthlyTargetsTable({
  filteredYearlyTargets,
  loading,
  canEdit,
  searchQuery,
  setSearchQuery,
  getMonthlyTarget,
  getTargetStatus,
  saveMonthlyTarget,
  fillAllMonths,
  toast,
  onRefreshData,
}: MonthlyTargetsTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (yearlyTargetId: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(yearlyTargetId)) {
        next.delete(yearlyTargetId);
      } else {
        next.add(yearlyTargetId);
      }
      return next;
    });
  };
  if (loading) {
    return (
      <TableContainer
        icon={CalendarDays}
        title="Monthly Targets"
        theme="blue"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by measurement..."
        loading
      />
    );
  }

  if (!filteredYearlyTargets || filteredYearlyTargets.length === 0) {
    return (
      <TableContainer
        icon={CalendarDays}
        title="Monthly Targets"
        theme="blue"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by measurement..."
        empty
        emptyTitle="No yearly targets found"
        emptyDescription="No yearly targets found. Create yearly targets first before distributing monthly."
      />
    );
  }

  return (
    <TableContainer
      icon={CalendarDays}
      title="Monthly Targets"
      theme="blue"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by measurement..."
      totalCount={filteredYearlyTargets.length}
      countUnit="target"
      searchActions={
        canEdit && (
          <Button
            size="sm"
            variant="outline"
            className="h-9 border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => {
              // Fill all rows with equal distribution across all 12 months
              filteredYearlyTargets.forEach((row) => {
                const monthlyTarget = Math.floor(row.total_target / 12);
                fillAllMonths(row.id, monthlyTarget, toast);
              });
              kpiNotifications.targetsDistributed(toast, filteredYearlyTargets.length);
            }}>
            <Target className="w-4 h-4 mr-1" />
            Fill All Months
          </Button>
        )
      }>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-blue-50">
            <TableRow className="border-b border-blue-200">
              <TableHead className="flex-shrink-0 w-16 text-center text-xs font-bold text-black bg-blue-100 pl-6 py-2">
                #
              </TableHead>
              <TableHead className="min-w-[150px] text-xs font-bold text-black bg-blue-100 py-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Measurement
                </div>
              </TableHead>
              <TableHead className="min-w-[120px] text-xs font-bold text-blue-700 bg-blue-100 py-2">
                Category
              </TableHead>
              <TableHead className="min-w-[120px] text-xs font-bold text-blue-700 bg-blue-100 py-2">
                Subcategory
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-right text-xs font-bold text-red-600 bg-blue-100 py-2">
                <div className="flex items-center justify-end gap-1">
                  <CalendarDays className="w-3 h-3" />
                  FY Target
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-right text-xs font-bold text-black bg-blue-100 py-2">
                <div className="flex items-center justify-end gap-1">
                  <Target className="w-3 h-3" />
                  Usage
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-right text-xs font-bold text-black bg-blue-100 py-2">
                <div className="flex items-center justify-end gap-1">
                  <Target className="w-3 h-3" />
                  Remain
                </div>
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-center text-xs font-bold text-black bg-blue-100 py-2">
                Unit
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-center text-xs font-bold text-black bg-blue-100 py-2">
                Main
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-center text-xs font-bold text-black bg-blue-100 py-2">
                Related
              </TableHead>
              <TableHead className="min-w-[60px] flex-shrink-0 text-center text-xs font-bold text-black bg-blue-100 py-2">
                Status
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-center text-xs font-bold text-black bg-blue-100 py-2">
                Approval
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-center text-xs font-bold text-black bg-blue-100 py-2">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredYearlyTargets.map((row, i) => {
              const isExpanded = expandedRows.has(row.id);
              const monthsWithTarget = MONTHS.filter((m) => {
                const mt = getMonthlyTarget(row.id, m.value);
                return mt?.target && mt.target > 0;
              }).length;
              const hasTargets = monthsWithTarget > 0;
              const allMonthsComplete = monthsWithTarget === 12;

              return (
                <React.Fragment key={row.id}>
                  <TableRow
                    className={`${TABLE_COLORS.border.default} ${TABLE_COLORS.hover.blue} transition-colors group cursor-pointer`}
                    onClick={() => toggleRow(row.id)}>
                    <TableCell
                      className={`text-center text-xs font-mono text-gray-400 font-bold pl-6 py-2 ${TABLE_COLORS.cell.rowNumber} flex-shrink-0 w-16`}>
                      {i + 1}
                    </TableCell>
                    <TableCell className={`py-2 ${TABLE_COLORS.cell.data} min-w-[150px]`}>
                      <div className="flex items-center gap-2">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-500" />
                        )}
                        <p className={`text-sm ${TABLE_COLORS.text.measurement} leading-tight`}>
                          {row.measurement ?? '---'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className={`py-2 ${TABLE_COLORS.cell.data} min-w-[120px]`}>
                      <p className="text-sm text-purple-600 leading-tight font-medium">
                        {row.category_name ?? '---'}
                      </p>
                    </TableCell>
                    <TableCell className={`py-2 ${TABLE_COLORS.cell.data} min-w-[120px]`}>
                      <p className="text-sm text-blue-600 leading-tight">
                        {row.sub_category_name ?? '---'}
                      </p>
                    </TableCell>
                    <TableCell
                      className={`text-right py-2 ${TABLE_COLORS.cell.alternate} min-w-[100px] flex-shrink-0`}>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-bold text-red-600`}>
                          {row.total_target.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right py-2 ${TABLE_COLORS.cell.alternate} min-w-[100px] flex-shrink-0`}>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-bold text-amber-600`}>
                          {row.used_quota.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-right py-2 ${TABLE_COLORS.cell.alternate} min-w-[100px] flex-shrink-0`}>
                      <div className="text-right">
                        <div className={`font-mono text-sm font-bold text-emerald-600`}>
                          {row.remaining_quota?.toLocaleString() ||
                            row.total_target?.toLocaleString() ||
                            '---'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-center py-2 ${TABLE_COLORS.cell.alternate} min-w-[80px] flex-shrink-0`}>
                      <div className="text-center">
                        <div className={`font-mono text-sm font-bold ${TABLE_COLORS.text.unit}`}>
                          {row.unit || '---'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-center py-2 ${TABLE_COLORS.cell.alternate} min-w-[80px] flex-shrink-0`}>
                      <div className="text-center">
                        <div className="font-mono text-sm font-bold text-gray-700">
                          {row.main || '---'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-center py-2 ${TABLE_COLORS.cell.alternate} min-w-[100px] flex-shrink-0`}>
                      <div className="text-center">
                        <div className={`font-mono text-sm font-bold ${TABLE_COLORS.text.unit}`}>
                          {row.main_relate_display?.includes('All')
                            ? 'All'
                            : row.main_relate_display || '---'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell
                      className={`text-center py-2 ${TABLE_COLORS.cell.alternate} min-w-[60px] flex-shrink-0`}>
                      {allMonthsComplete ? (
                        <span className="text-xs font-bold text-green-600">Done</span>
                      ) : monthsWithTarget > 0 ? (
                        <span className="text-xs font-bold text-amber-600">Partial</span>
                      ) : (
                        <span className="text-xs font-bold text-red-600">None</span>
                      )}
                    </TableCell>
                    <TableCell
                      className={`text-center py-2 ${TABLE_COLORS.cell.alternate} min-w-[100px] flex-shrink-0`}>
                      <ApprovalStatusBadge status={row.approval_status} />
                    </TableCell>
                    <TableCell
                      className={`text-center py-2 ${TABLE_COLORS.cell.alternate} min-w-[80px] flex-shrink-0`}>
                      <div className="flex justify-center gap-1">
                        {row.approval_status === 'pending' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(row.id, 'hos', toast, onRefreshData);
                              }}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(row.id, 'hos', toast, onRefreshData);
                              }}>
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {row.approval_status === 'hos_approved' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApprove(row.id, 'hod', toast, onRefreshData);
                              }}>
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReject(row.id, 'hod', toast, onRefreshData);
                              }}>
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                        {row.approval_status === 'approved' && (
                          <div className="text-xs text-green-600 font-medium">Approved</div>
                        )}
                        {row.approval_status === 'rejected' && (
                          <div className="text-xs text-red-600 font-medium">Rejected</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <>
                      {MONTHS.map((month) => {
                        const monthValue = month.value;
                        const status = getTargetStatus(row.id, monthValue);
                        const StatusIcon =
                          status.icon === 'CheckCircle'
                            ? CheckCircle
                            : status.icon === 'Target'
                              ? Target
                              : Circle;
                        const mt = getMonthlyTarget(row.id, monthValue);
                        const hasTarget = mt?.target && mt.target > 0;

                        return (
                          <React.Fragment key={month.value}>
                            <TableRow className="bg-blue-50/30 border-l-4 border-blue-300">
                              <TableCell className="pl-8 py-2">
                                <span className="text-xs font-bold text-black">{month.label}</span>
                              </TableCell>
                              <TableCell colSpan={10} className="py-2">
                                <div className="flex items-center gap-4">
                                  {canEdit ? (
                                    <Input
                                      type="number"
                                      min="0"
                                      max={row.total_target}
                                      className="w-48 h-8 text-center text-sm bg-white border-blue-200 focus:border-blue-400 font-mono"
                                      defaultValue={mt?.target?.toString() || ''}
                                      onClick={(e) => e.stopPropagation()}
                                      onFocus={(e) => e.stopPropagation()}
                                      onBlur={(e) => {
                                        e.stopPropagation();
                                        const value = parseFloat(e.target.value) || 0;
                                        if (value > row.total_target) {
                                          kpiNotifications.quotaExceeded(
                                            toast,
                                            row.total_target.toLocaleString()
                                          );
                                          e.target.value = mt?.target?.toString() || '';
                                          return;
                                        }
                                        if (value !== (mt?.target || 0)) {
                                          saveMonthlyTarget(
                                            row.id,
                                            monthValue,
                                            value,
                                            undefined,
                                            toast
                                          );
                                        }
                                      }}
                                    />
                                  ) : (
                                    <div
                                      className={`font-mono text-sm px-3 py-1 rounded min-w-[120px] ${
                                        mt?.target === 0 || !mt?.target
                                          ? 'text-gray-400 bg-gray-50'
                                          : 'text-red-600 bg-red-50'
                                      }`}>
                                      {mt?.target?.toLocaleString() || '---'}
                                    </div>
                                  )}
                                  <span className="text-xs text-red-600 font-medium">Target</span>
                                  {hasTarget ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          </React.Fragment>
                        );
                      })}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
