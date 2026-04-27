import React from 'react';
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
} from 'lucide-react';
import { TableContainer, TABLE_STYLES } from '@/shared/components/TableContainer';
import { AttachmentPanel } from '@/components/kpi/AttachmentPanel';
import { AddTargetModal } from '@/components/kpi/AddTargetModal';
import { MONTHS, Category } from '../shared';
import { YearlyTarget } from './useYearlyTargetsData';

interface YearlyTargetsTableProps {
  filteredRows: YearlyTarget[];
  loading: boolean;
  canEdit: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedMonth: 'all' | number;
  setSelectedMonth: (v: 'all' | number) => void;
  drafts: Record<number, { target: string; note: string; attachment: any }>;
  onChange: (id: number, value: string) => void;
  onNoteChange: (id: number, value: string) => void;
  onAttachmentChange: (id: number, attachment: any) => void;
  saveRow: (row: YearlyTarget, toast: any) => void;
  showAddModal: boolean;
  setShowAddModal: (v: boolean) => void;
  selectedCatName: string;
  categories: Category[];
  cat: string;
  toast: any;
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
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-green-500">
      <CheckCircle className="w-3 h-3" />
      Active
    </span>
  );
};

export function YearlyTargetsTable({
  filteredRows,
  loading,
  canEdit,
  searchQuery,
  setSearchQuery,
  selectedMonth,
  setSelectedMonth,
  drafts,
  onChange,
  onNoteChange,
  onAttachmentChange,
  saveRow,
  showAddModal,
  setShowAddModal,
  selectedCatName,
  categories,
  cat,
  toast,
}: YearlyTargetsTableProps) {
  const searchActions = (
    <>
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

  if (filteredRows.length === 0) {
    return (
      <TableContainer
        icon={Target}
        title="Yearly Targets"
        theme="gray"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by measurement..."
        searchActions={searchActions}
        empty
        emptyTitle="No KPIs found"
        emptyDescription={`No yearly targets found for ${selectedCatName}. Create yearly targets to set annual KPI goals.`}
      />
    );
  }

  return (
    <>
      <TableContainer
        icon={Target}
        title="Yearly Targets"
        theme="gray"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by measurement..."
        searchActions={searchActions}
        totalCount={filteredRows.length}
        countUnit="target">
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
                <TableHead className="text-right text-xs font-bold text-gray-700 bg-gray-50 py-2 min-w-[100px] flex-shrink-0">
                  <div className="flex items-center justify-end gap-1">
                    <TrendingUp className="w-3 h-3" />
                    FY Target
                  </div>
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-amber-600 bg-gray-50 py-2 min-w-[80px] flex-shrink-0">
                  Usage
                </TableHead>
                <TableHead className="text-right text-xs font-bold text-emerald-600 bg-gray-50 py-2 min-w-[80px] flex-shrink-0">
                  Remain
                </TableHead>
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
              {filteredRows.map((row, i) => {
                const draft = drafts[row.id];
                return (
                  <React.Fragment key={row.id}>
                    <TableRow className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors group">
                      <TableCell className="text-center text-xs font-mono text-gray-400 font-bold pl-6 py-2 bg-gray-50/50 flex-shrink-0 w-16">
                        {i + 1}
                      </TableCell>
                      <TableCell className="py-2 bg-white min-w-[150px]">
                        <p className="text-sm font-bold text-gray-900 leading-tight">
                          {row.measurement ?? '---'}
                        </p>
                      </TableCell>
                      <TableCell className="text-right py-2 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                        <div className="text-right">
                          <div className="font-mono text-sm font-bold text-indigo-700">
                            {row.total_target.toLocaleString()}
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
                      <TableCell className="text-center py-2 bg-gray-50/30 min-w-[80px] flex-shrink-0">
                        <div className="text-center">
                          <div className="font-mono text-sm font-bold text-purple-600">
                            {row.unit || '---'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2 bg-gray-50/30 min-w-[80px] flex-shrink-0">
                        <div className="text-center">
                          <div className="font-mono text-sm font-bold text-gray-700">
                            {row.main || '---'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                        <div className="text-center">
                          <div className="font-mono text-sm font-bold text-purple-600">
                            {row.main_relate_display?.includes('All')
                              ? 'All'
                              : row.main_relate_display || '---'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-2 min-w-[100px] flex-shrink-0">
                        <StatusChip row={row} />
                      </TableCell>
                      <TableCell className="text-center pr-6 py-2 min-w-[80px] flex-shrink-0">
                        {canEdit && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs border-gray-200 hover:bg-gray-50"
                            onClick={() => saveRow(row, toast)}
                            disabled={row.saving}>
                            {row.saving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
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
