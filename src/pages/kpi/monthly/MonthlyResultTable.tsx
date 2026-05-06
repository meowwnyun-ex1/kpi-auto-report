import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  Target,
  Loader2,
  CalendarDays,
  TrendingUp,
  TrendingDown,
  Minus,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  FileText,
  Upload,
} from 'lucide-react';
import { TableContainer } from '@/shared/components/TableContainer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { MONTHS } from '../shared';
import { MonthlyResultRow } from './useMonthlyResultData';
import { kpiNotifications } from '@/shared/constants/notifications';
import { useToast } from '@/shared/hooks/use-toast';

interface MonthlyResultTableProps {
  filteredRows: MonthlyResultRow[];
  loading: boolean;
  canEdit: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedCatName: string;
  onChangeResult: (yearlyTargetId: number, month: number, value: string) => void;
  saveMonthResult: (yearlyTargetId: number, month: number, monthData: any, toast: any) => void;
  toast: any;
}

const handleApproveResult = async (id: number, level: 'admin', toast: any) => {
  try {
    const response = await fetch(`/api/approval/result/${id}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ level }),
    });

    if (response.ok) {
      toast({
        title: 'Success',
        description: 'Result approved',
      });
      window.location.reload();
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

const ResultApprovalStatusBadge = ({
  status,
  isIncomplete,
}: {
  status?: string;
  isIncomplete?: boolean;
}) => {
  if (isIncomplete) {
    return <Badge className="text-amber-600 bg-amber-100">Incomplete</Badge>;
  }

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'text-gray-600 bg-gray-100' },
    approved: { label: 'Approved', color: 'text-green-600 bg-green-100' },
    rejected: { label: 'Rejected', color: 'text-red-600 bg-red-100' },
  };

  const config = statusConfig[status || 'pending'] || statusConfig.pending;
  return <Badge className={config.color}>{config.label}</Badge>;
};

export function MonthlyResultTable({
  filteredRows,
  loading,
  canEdit,
  searchQuery,
  setSearchQuery,
  selectedCatName,
  onChangeResult,
  saveMonthResult,
  toast,
}: MonthlyResultTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [declarationDialogOpen, setDeclarationDialogOpen] = useState(false);
  const [selectedMonthId, setSelectedMonthId] = useState<number | null>(null);
  const [declarationText, setDeclarationText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState('');
  const [loadingDeclaration, setLoadingDeclaration] = useState(false);

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
  // Calculate achievement rate
  const getAchievementRate = (target: number | null, result: number | null) => {
    if (!target || target === 0) return null;
    if (result === null || result === undefined) return null;
    return ((result / target) * 100).toFixed(2);
  };

  // Get achievement icon based on rate
  const getAchievementIcon = (rate: string | null) => {
    if (!rate) return null;
    const rateNum = parseFloat(rate);
    if (rateNum >= 100) return <TrendingUp className="w-3 h-3 text-green-600" />;
    if (rateNum >= 80) return <Minus className="w-3 h-3 text-blue-600" />;
    return <TrendingDown className="w-3 h-3 text-red-600" />;
  };

  // Get achievement color class
  const getAchievementColor = (rate: string | null) => {
    if (!rate) return 'text-gray-400';
    const rateNum = parseFloat(rate);
    if (rateNum >= 100) return 'text-green-600';
    if (rateNum >= 80) return 'text-blue-600';
    return 'text-red-600';
  };

  const handleOpenDeclaration = async (monthId: number) => {
    setSelectedMonthId(monthId);
    setLoadingDeclaration(true);
    try {
      const response = await fetch(`/api/approval/result/${monthId}/declaration`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
      if (response.ok) {
        const data = await response.json();
        if (data) {
          setDeclarationText(data.declaration_text || '');
          setAttachmentUrl(data.attachment_url || '');
        } else {
          setDeclarationText('');
          setAttachmentUrl('');
        }
      }
    } catch (error) {
      console.error('Error fetching declaration:', error);
    } finally {
      setLoadingDeclaration(false);
    }
    setDeclarationDialogOpen(true);
  };

  const handleSaveDeclaration = async () => {
    if (!selectedMonthId) return;
    setLoadingDeclaration(true);
    try {
      const response = await fetch(`/api/approval/result/${selectedMonthId}/declaration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          declaration_text: declarationText,
          attachment_url: attachmentUrl,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Declaration saved successfully',
        });
        setDeclarationDialogOpen(false);
        window.location.reload();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to save declaration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Error saving declaration',
        variant: 'destructive',
      });
    } finally {
      setLoadingDeclaration(false);
    }
  };

  if (loading) {
    return (
      <TableContainer
        icon={Target}
        title="Monthly Performance"
        theme="emerald"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by measurement..."
        loading
      />
    );
  }

  if (filteredRows.length === 0) {
    return (
      <TableContainer
        icon={Target}
        title="Monthly Performance"
        theme="emerald"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by measurement..."
        empty
        emptyTitle="No monthly targets found"
        emptyDescription={`No monthly targets found for ${selectedCatName}. Distribute yearly targets first before entering results.`}
      />
    );
  }

  return (
    <TableContainer
      icon={Target}
      title="Monthly Management - Targets & Results"
      theme="emerald"
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by measurement..."
      totalCount={filteredRows.length}
      countUnit="target">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-emerald-50">
            <TableRow className="border-b border-emerald-200">
              <TableHead className="flex-shrink-0 w-16 text-center text-xs font-bold text-black bg-emerald-100 pl-6 py-2">
                #
              </TableHead>
              <TableHead className="min-w-[150px] text-xs font-bold text-black bg-emerald-100 py-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Measurement
                </div>
              </TableHead>
              <TableHead className="min-w-[120px] text-xs font-bold text-purple-700 bg-emerald-100 py-2">
                Category
              </TableHead>
              <TableHead className="min-w-[120px] text-xs font-bold text-emerald-700 bg-emerald-100 py-2">
                Subcategory
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-right text-xs font-bold text-red-600 bg-emerald-100 py-2">
                <div className="flex items-center justify-end gap-1">
                  <CalendarDays className="w-3 h-3" />
                  FY Target
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-right text-xs font-bold text-black bg-emerald-100 py-2">
                <div className="flex items-center justify-end gap-1">
                  <Target className="w-3 h-3" />
                  Usage
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-right text-xs font-bold text-black bg-emerald-100 py-2">
                <div className="flex items-center justify-end gap-1">
                  <Target className="w-3 h-3" />
                  Remain
                </div>
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-center text-xs font-bold text-black bg-emerald-100 py-2">
                Unit
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-center text-xs font-bold text-black bg-emerald-100 py-2">
                Main
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-center text-xs font-bold text-black bg-emerald-100 py-2">
                Related
              </TableHead>
              <TableHead className="min-w-[60px] flex-shrink-0 text-center text-xs font-bold text-black bg-emerald-100 py-2">
                Status
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-center text-xs font-bold text-black bg-emerald-100 py-2">
                Approval
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-center text-xs font-bold text-black bg-emerald-100 py-2">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row, i) => {
              const isExpanded = expandedRows.has(row.yearly_target_id);
              const isComplete = row.remaining_quota === 0 || row.remaining_quota <= 0;
              const completedMonths = MONTHS.filter((m) => {
                const monthData = row.months[m.value];
                return monthData?.result !== null && monthData?.result !== undefined;
              }).length;
              const totalMonthsWithTarget = MONTHS.filter((m) => {
                const monthData = row.months[m.value];
                return monthData?.target && monthData.target > 0;
              }).length;
              const hasTargets = totalMonthsWithTarget > 0;
              const allMonthsComplete =
                completedMonths === totalMonthsWithTarget && totalMonthsWithTarget > 0;

              return (
                <React.Fragment key={row.yearly_target_id}>
                  <TableRow
                    className={`border-b border-gray-200 hover:bg-emerald-50 transition-colors ${hasTargets ? 'cursor-pointer' : ''}`}
                    onClick={() => hasTargets && toggleRow(row.yearly_target_id)}>
                    <TableCell className="text-center text-xs font-mono text-gray-400 font-bold pl-6 py-2 bg-emerald-50/50 flex-shrink-0 w-16">
                      {i + 1}
                    </TableCell>
                    <TableCell className="py-2 min-w-[150px]">
                      <div className="flex items-center gap-2">
                        {hasTargets ? (
                          isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )
                        ) : null}
                        <p className="text-sm text-gray-700 leading-tight">
                          {row.measurement ?? '---'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 bg-emerald-50/50 min-w-[120px] flex-shrink-0">
                      <p className="text-sm text-purple-600 leading-tight font-medium">
                        {row.category_name ?? '---'}
                      </p>
                    </TableCell>
                    <TableCell className="py-2 bg-emerald-50/50 min-w-[120px] flex-shrink-0">
                      <p className="text-sm text-emerald-600 leading-tight">
                        {row.sub_category_name ?? '---'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right py-2 bg-emerald-50/50 min-w-[100px] flex-shrink-0">
                      <div className={`font-mono text-sm font-bold text-red-600`}>
                        {row.fy_target?.toLocaleString() || '---'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 bg-emerald-50/50 min-w-[100px] flex-shrink-0">
                      <div className="font-mono text-sm font-bold text-amber-600">
                        {row.used_quota?.toLocaleString() || '0'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 bg-emerald-50/50 min-w-[100px] flex-shrink-0">
                      <div className="font-mono text-sm font-bold text-emerald-600">
                        {row.remaining_quota?.toLocaleString() ||
                          row.total_target?.toLocaleString() ||
                          '---'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2 bg-emerald-50/50 min-w-[80px] flex-shrink-0">
                      <div className="font-mono text-sm font-bold text-gray-700">
                        {row.unit || '---'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2 bg-emerald-50/50 min-w-[80px] flex-shrink-0">
                      <div className="font-mono text-sm font-bold text-gray-700">
                        {row.main || '---'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2 bg-emerald-50/50 min-w-[100px] flex-shrink-0">
                      <div className="font-mono text-sm font-bold text-gray-700">
                        {row.main_relate_display?.includes('All')
                          ? 'All'
                          : row.main_relate_display || '---'}
                      </div>
                    </TableCell>
                    <TableCell className="text-center py-2 bg-emerald-50/50 min-w-[60px] flex-shrink-0">
                      {!hasTargets ? (
                        <div className="text-xs text-gray-400 italic">No targets</div>
                      ) : allMonthsComplete ? (
                        <span className="text-xs font-bold text-green-600">Done</span>
                      ) : completedMonths > 0 ? (
                        <span className="text-xs font-bold text-amber-600">Partial</span>
                      ) : (
                        <span className="text-xs font-bold text-red-600">None</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center py-2 bg-emerald-50/50 min-w-[100px] flex-shrink-0">
                      <ResultApprovalStatusBadge
                        status={row.result_approval_status}
                        isIncomplete={row.is_incomplete}
                      />
                    </TableCell>
                    <TableCell className="text-center py-2 bg-emerald-50/50 min-w-[80px] flex-shrink-0">
                      <div className="flex justify-center gap-1">
                        {row.result_approval_status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApproveResult(row.id, 'admin', toast);
                            }}>
                            <Check className="w-3 h-3" />
                          </Button>
                        )}
                        {row.result_approval_status === 'approved' && (
                          <div className="text-xs text-green-600 font-medium">Approved</div>
                        )}
                        {row.result_approval_status === 'rejected' && (
                          <div className="text-xs text-red-600 font-medium">Rejected</div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  {isExpanded && (
                    <>
                      {MONTHS.map((m) => {
                        const monthValue = m.value;
                        const monthData = row.months[monthValue];
                        const achievementRate = getAchievementRate(
                          monthData?.target,
                          monthData?.result
                        );
                        const hasTarget = monthData?.target && monthData.target > 0;
                        const hasResult = monthData?.result && monthData.result > 0;
                        const monthComplete = hasResult && hasTarget;

                        return (
                          <React.Fragment key={m.value}>
                            <TableRow className="bg-emerald-50/30 border-l-4 border-emerald-300">
                              <TableCell className="pl-8 py-2">
                                <span className="text-xs font-bold text-black">{m.label}</span>
                              </TableCell>
                              <TableCell colSpan={10} className="py-2">
                                <div className="flex items-center gap-4">
                                  <div
                                    className={`font-mono text-sm px-3 py-1 rounded min-w-[120px] ${
                                      !hasTarget
                                        ? 'text-gray-400 bg-gray-50'
                                        : 'text-red-600 bg-red-50'
                                    }`}>
                                    {monthData?.target?.toLocaleString() || '---'}
                                  </div>
                                  <span className="text-xs text-red-600 font-medium">Target</span>
                                  {monthComplete ? (
                                    <Check className="w-4 h-4 text-green-600" />
                                  ) : hasTarget ? (
                                    <Minus className="w-4 h-4 text-amber-600" />
                                  ) : (
                                    <X className="w-4 h-4 text-red-600" />
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                            <TableRow className="bg-emerald-50/30 border-l-4 border-emerald-300">
                              <TableCell className="pl-8 py-2"></TableCell>
                              <TableCell colSpan={10} className="py-2">
                                <div className="flex items-center gap-4">
                                  {hasTarget ? (
                                    isComplete ? (
                                      canEdit ? (
                                        <Input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          className="w-full h-8 text-center text-sm bg-emerald-50 border-emerald-200"
                                          value={monthData?.draftResult || ''}
                                          onClick={(e) => e.stopPropagation()}
                                          onFocus={(e) => e.stopPropagation()}
                                          onChange={(e) =>
                                            onChangeResult(
                                              row.yearly_target_id,
                                              monthValue,
                                              e.target.value
                                            )
                                          }
                                          placeholder="0"
                                        />
                                      ) : (
                                        <div
                                          className={`font-mono text-sm px-3 py-1 rounded min-w-[120px] ${
                                            monthData?.result === 0 || !monthData?.result
                                              ? 'text-gray-400 bg-gray-50'
                                              : 'text-emerald-600 bg-emerald-50'
                                          }`}>
                                          {monthData?.result?.toLocaleString() || '---'}
                                        </div>
                                      )
                                    ) : (
                                      <div className="font-mono text-sm px-3 py-1 rounded min-w-[120px] text-gray-400 bg-gray-50">
                                        0
                                      </div>
                                    )
                                  ) : (
                                    <div className="text-sm text-gray-400 italic">No target</div>
                                  )}
                                  <span className="text-xs text-emerald-600 font-medium">
                                    Result
                                  </span>
                                  {achievementRate && hasTarget && isComplete && (
                                    <div className="flex items-center gap-1">
                                      {getAchievementIcon(achievementRate)}
                                      <span
                                        className={`font-mono text-sm font-bold ${getAchievementColor(
                                          achievementRate
                                        )}`}>
                                        {achievementRate}%
                                      </span>
                                    </div>
                                  )}
                                  {canEdit && isComplete && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        saveMonthResult(
                                          row.yearly_target_id,
                                          monthValue,
                                          monthData,
                                          toast
                                        );
                                      }}>
                                      <Save className="w-3 h-3" />
                                    </Button>
                                  )}
                                  {canEdit && hasTarget && !monthData?.result && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2 text-xs text-amber-600 border-amber-200 hover:bg-amber-50"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenDeclaration(monthData?.id);
                                      }}>
                                      <FileText className="w-3 h-3 mr-1" />
                                      Declare
                                    </Button>
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
