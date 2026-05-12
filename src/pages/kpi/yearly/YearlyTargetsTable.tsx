import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Save,
  Target,
  Loader2,
  AlertCircle,
  CheckCircle,
  Calendar,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Check,
  X,
  Shield,
} from 'lucide-react';
import { TableContainer, TABLE_STYLES } from '@/shared/components/TableContainer';
import { AttachmentPanel } from '@/components/kpi/AttachmentPanel';
import { AddTargetModal } from '@/components/kpi/AddTargetModal';
import { MONTHS, Category } from '../shared';
import { YearlyTarget } from './useYearlyTargetsData';
import { useToast } from '@/shared/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { ApiService } from '@/services/api-service';

interface YearlyTargetsTableProps {
  filteredRows?: YearlyTarget[];
  data?: any[];
  loading: boolean;
  canEdit?: boolean;
  searchQuery?: string;
  setSearchQuery?: (v: string) => void;
  selectedMonth?: 'all' | number;
  setSelectedMonth?: (v: 'all' | number) => void;
  drafts?: Record<number, { target: string; note: string; attachment: any }>;
  onChange?: (id: number, value: string) => void;
  onNoteChange?: (id: number, value: string) => void;
  onAttachmentChange?: (id: number, attachment: any) => void;
  saveRow?: (row: YearlyTarget, toast: any) => void;
  showAddModal?: boolean;
  setShowAddModal?: (v: boolean) => void;
  selectedCatName?: string;
  categories?: Category[];
  cat?: string;
  toast?: any;
  showResults?: boolean;
  fiscalYear?: number;
  onRefreshData?: () => void;
}

const StatusChip = ({ row }: { row: YearlyTarget }) => {
  if (row.saving)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-blue-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        Saving
      </span>
    );
  if (row.dirty)
    return (
      <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-medium">
        <AlertCircle className="w-3 h-3" />
        Edited
      </span>
    );

  // Approval status
  const approvalStatus = row.approval_status || 'pending';
  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'Pending', color: 'text-gray-600 bg-gray-100' },
    hos_approved: { label: 'HoS Approved', color: 'text-blue-600 bg-blue-100' },
    hod_approved: { label: 'HoD Approved', color: 'text-purple-600 bg-purple-100' },
    approved: { label: 'Approved', color: 'text-green-600 bg-green-100' },
    rejected: { label: 'Rejected', color: 'text-red-600 bg-red-100' },
  };

  const config = statusConfig[approvalStatus] || statusConfig.pending;
  return <Badge className={config.color}>{config.label}</Badge>;
};

const handleApprove = async (
  row: YearlyTarget,
  level: 'hos' | 'hod',
  toast: any,
  userRole?: string,
  onRefreshData?: () => void
) => {
  // Role-based access control
  if (level === 'hos' && userRole !== 'hos' && userRole !== 'admin' && userRole !== 'superadmin') {
    toast({
      title: 'Access Denied',
      description: 'Only HoS, Admin, or Super Admin can approve at HoS level',
      variant: 'destructive',
    });
    return;
  }
  if (level === 'hod' && userRole !== 'hod' && userRole !== 'admin' && userRole !== 'superadmin') {
    toast({
      title: 'Access Denied',
      description: 'Only HoD, Admin, or Super Admin can approve at HoD level',
      variant: 'destructive',
    });
    return;
  }

  try {
    const res = await ApiService.post<any>(`/approval/yearly/${row.id}/approve`, { level });
    if (res?.success !== false) {
      toast({
        title: 'Success',
        description: 'Approved successfully',
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
  row: YearlyTarget,
  level: 'hos' | 'hod',
  toast: any,
  userRole?: string,
  onRefreshData?: () => void
) => {
  // Role-based access control
  if (level === 'hos' && userRole !== 'hos' && userRole !== 'admin' && userRole !== 'superadmin') {
    toast({
      title: 'Access Denied',
      description: 'Only HoS, Admin, or Super Admin can reject at HoS level',
      variant: 'destructive',
    });
    return;
  }
  if (level === 'hod' && userRole !== 'hod' && userRole !== 'admin' && userRole !== 'superadmin') {
    toast({
      title: 'Access Denied',
      description: 'Only HoD, Admin, or Super Admin can reject at HoD level',
      variant: 'destructive',
    });
    return;
  }

  const comments = prompt('Please provide rejection reason:');
  if (!comments) return;

  try {
    const res = await ApiService.post<any>(`/approval/yearly/${row.id}/reject`, { level, comments });
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

export function YearlyTargetsTable({
  filteredRows,
  data,
  loading,
  canEdit = false,
  searchQuery,
  setSearchQuery,
  selectedMonth,
  setSelectedMonth,
  drafts = {},
  onChange,
  onNoteChange,
  onAttachmentChange,
  saveRow,
  showAddModal = false,
  setShowAddModal,
  selectedCatName,
  categories,
  cat,
  toast,
  showResults = false,
  fiscalYear,
  onRefreshData,
}: YearlyTargetsTableProps) {
  const { user } = useAuth();
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (id: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const rows = showResults ? data || [] : filteredRows || [];

  // For result view, calculate achievement rate
  const getAchievementRate = (item: any) => {
    if (!showResults) return null;
    const target = item.fy_target || 0;
    const result = item.result || 0;
    if (target === 0) return null;
    return ((result / target) * 100).toFixed(2);
  };

  const getStatusBadge = (item: any) => {
    if (!showResults) return null;
    const rate = getAchievementRate(item);
    if (!rate) return <Badge variant="outline">No Target</Badge>;
    const rateNum = parseFloat(rate);
    if (rateNum >= 100) return <Badge className="bg-green-100 text-green-800">Achieved</Badge>;
    if (rateNum >= 90) return <Badge className="bg-blue-100 text-blue-800">Good</Badge>;
    if (rateNum >= 75) return <Badge className="bg-amber-100 text-amber-800">Fair</Badge>;
    return <Badge className="bg-red-100 text-red-800">Below Target</Badge>;
  };
  const searchActions = (
    <>
      {selectedMonth && (
        <Select
          value={selectedMonth.toString()}
          onValueChange={(v) => setSelectedMonth(v === 'all' ? 'all' : parseInt(v))}>
          <SelectTrigger className="w-[120px] h-9 bg-gray-50 border-gray-200 text-sm">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {MONTHS.map((m) => (
              <SelectItem key={m.value} value={m.value.toString()}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {canEdit && (
        <Button
          size="sm"
          className="h-9 bg-blue-600 hover:bg-blue-700 text-white"
          onClick={() => setShowAddModal(true)}>
          <Target className="w-3.5 h-3.5 mr-1.5" />
          Add New Target
        </Button>
      )}
    </>
  );

  if (loading) {
    return (
      <TableContainer
        icon={Target}
        title="Yearly Targets"
        theme="gray"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by measurement..."
        searchActions={searchActions}
        loading
      />
    );
  }

  if (rows.length === 0) {
    return (
      <TableContainer
        icon={Target}
        title={showResults ? 'Yearly Results' : 'Yearly Targets'}
        theme="gray"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by measurement..."
        searchActions={searchActions}
        empty
        emptyTitle="No KPIs found"
        emptyDescription={`No yearly ${showResults ? 'results' : 'targets'} found for ${selectedCatName}. ${!showResults ? 'Create yearly targets to set annual KPI goals.' : ''}`}
      />
    );
  }

  return (
    <>
      <TableContainer
        icon={Target}
        title={showResults ? 'Yearly Results' : 'Yearly Targets'}
        theme="gray"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by measurement..."
        searchActions={searchActions}
        totalCount={rows.length}
        countUnit={showResults ? 'result' : 'target'}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-gradient-to-r from-gray-50 to-slate-100 sticky top-0 z-10">
              <TableRow className={TABLE_STYLES.headerRow}>
                <TableHead
                  className={`flex-shrink-0 w-16 bg-gray-50 ${TABLE_STYLES.headerCell} pl-6 py-2`}>
                  #
                </TableHead>
                <TableHead className="text-xs font-bold text-gray-700 bg-gray-50 py-2 min-w-[150px]">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-600" />
                    Measurement
                  </div>
                </TableHead>
                <TableHead className="text-xs font-bold text-purple-700 bg-gray-50 py-2 min-w-[120px] flex-shrink-0">
                  Category
                </TableHead>
                <TableHead className="text-xs font-bold text-blue-700 bg-gray-50 py-2 min-w-[120px] flex-shrink-0">
                  Subcategory
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-gray-700 bg-gray-50 py-2 min-w-[100px] flex-shrink-0">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {showResults ? 'Target' : 'FY Target'}
                  </div>
                </TableHead>
                {showResults ? (
                  <>
                    <TableHead className="text-right text-xs font-bold text-green-700 bg-gray-50 py-2 min-w-[100px] flex-shrink-0">
                      <div className="flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Result
                      </div>
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-blue-700 bg-gray-50 py-2 min-w-[80px] flex-shrink-0">
                      Achievement
                    </TableHead>
                  </>
                ) : (
                  <>
                    <TableHead className="text-right text-xs font-bold text-amber-600 bg-gray-50 py-2 min-w-[80px] flex-shrink-0">
                      Usage
                    </TableHead>
                    <TableHead className="text-right text-xs font-bold text-emerald-600 bg-gray-50 py-2 min-w-[80px] flex-shrink-0">
                      Remain
                    </TableHead>
                  </>
                )}
                <TableHead className="text-center text-xs font-bold text-gray-700 bg-gray-50 py-2 min-w-[80px] flex-shrink-0">
                  Unit
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-gray-700 bg-gray-50 py-2 min-w-[80px] flex-shrink-0">
                  Main
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-gray-700 bg-gray-50 py-2 min-w-[100px] flex-shrink-0">
                  Related
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-gray-700 bg-gray-50 py-2 min-w-[100px] flex-shrink-0">
                  Status
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-gray-700 bg-gray-50 pr-6 py-2 min-w-[80px] flex-shrink-0">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row, i) => {
                const draft = drafts[row.id];
                const isExpanded = expandedRows.has(row.id);
                const isComplete = row.remaining_quota === 0 || row.remaining_quota <= 0;
                return (
                  <React.Fragment key={row.id}>
                    <TableRow
                      className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors group cursor-pointer"
                      onClick={() => toggleRow(row.id)}>
                      <TableCell className="text-center text-xs font-mono text-gray-400 font-bold pl-6 py-2 bg-gray-50/50 flex-shrink-0 w-16">
                        {i + 1}
                      </TableCell>
                      <TableCell className="py-2 bg-white min-w-[150px]">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-500" />
                          )}
                          <p className="text-sm font-bold text-gray-900 leading-tight">
                            {row.measurement ?? '---'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="py-2 bg-gray-50/30 min-w-[120px] flex-shrink-0">
                        <p className="text-sm text-purple-600 leading-tight font-medium">
                          {row.category_name ?? '---'}
                        </p>
                      </TableCell>
                      <TableCell className="py-2 bg-gray-50/30 min-w-[120px] flex-shrink-0">
                        <p className="text-sm text-blue-600 leading-tight">
                          {row.sub_category_name ?? '---'}
                        </p>
                      </TableCell>
                      {showResults ? (
                        <>
                          <TableCell className="text-right py-2 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                            <div className="text-right">
                              <div className="font-mono text-sm font-bold text-red-600">
                                {row.fy_target?.toLocaleString() || '---'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                            <div className="text-right">
                              <div className="font-mono text-sm font-bold text-green-600">
                                {row.result?.toLocaleString() || '---'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2 bg-gray-50/30 min-w-[80px] flex-shrink-0">
                            <div className="text-right">
                              <div className="font-mono text-sm font-bold text-blue-600">
                                {getAchievementRate(row) ? `${getAchievementRate(row)}%` : '---'}
                              </div>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-right py-2 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                            <div className="text-right">
                              <div className="font-mono text-sm font-bold text-red-600">
                                {row.total_target?.toLocaleString()}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2 bg-gray-50/30 min-w-[80px] flex-shrink-0">
                            <div className="font-mono text-sm font-bold text-amber-600">
                              {row.used_quota?.toLocaleString() || '0'}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-2 bg-gray-50/30 min-w-[80px] flex-shrink-0">
                            <div className="font-mono text-sm font-bold text-emerald-600">
                              {row.remaining_quota?.toLocaleString() ||
                                row.total_target?.toLocaleString() ||
                                '---'}
                            </div>
                          </TableCell>
                        </>
                      )}
                      <TableCell className="text-center py-2 bg-gray-50/30 min-w-[80px] flex-shrink-0">
                        <div className="text-center">
                          <div className="font-mono text-sm font-bold text-purple-600">
                            {row.unit || '---'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2 bg-gray-50/30 min-w-[80px] flex-shrink-0">
                        <div className="text-center">
                          <div className="font-mono text-sm font-bold text-blue-600">
                            {row.main || '---'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                        <div className="text-center">
                          <div className="font-mono text-sm font-bold text-green-600">
                            {row.main_relate || '---'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                        <div className="flex justify-center">
                          {showResults ? getStatusBadge(row) : <StatusChip row={row} />}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2 bg-gray-50/30 min-w-[80px] flex-shrink-0">
                        <div className="flex justify-center gap-1">
                          {showResults ? (
                            <div className="text-xs text-gray-400">View Only</div>
                          ) : canEdit ? (
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-xs"
                                onClick={() => saveRow?.(row, toast)}>
                                <Save className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              {/* Approve/Reject buttons based on approval status */}
                              {row.approval_status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs text-green-600 border-green-200 hover:bg-green-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleApprove(row, 'hos', toast, user?.role, onRefreshData);
                                    }}>
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(row, 'hos', toast, user?.role, onRefreshData);
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
                                      handleApprove(row, 'hod', toast, user?.role, onRefreshData);
                                    }}>
                                    <Check className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleReject(row, 'hod', toast, user?.role, onRefreshData);
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
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && !showResults && (
                      <TableRow className="bg-gray-50/30 border-l-4 border-gray-300">
                        <TableCell colSpan={12} className="p-4">
                          <div className="text-sm text-gray-600 italic">
                            Monthly targets distribution for {row.measurement}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </TableContainer>

      {/* Add Target Modal */}
      <AddTargetModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        categoryId={categories.find((c) => c.key === cat)?.id ?? 0}
        categoryName={selectedCatName}
        onSuccess={() => {
          /* Handled by parent */
        }}
      />
    </>
  );
}
