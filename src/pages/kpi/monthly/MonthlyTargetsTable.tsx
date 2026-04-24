import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Target, CalendarDays, CheckCircle, Circle } from 'lucide-react';
import { TABLE_COLORS } from '@/constants/colors';
import { TableContainer } from '@/components/shared/TableContainer';
import { MONTHS } from '../shared';
import { YearlyTarget } from '../shared';
import { kpiNotifications } from '@/constants/notifications';

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
}

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
}: MonthlyTargetsTableProps) {
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

  if (filteredYearlyTargets.length === 0) {
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
              // Fill all rows with equal distribution
              filteredYearlyTargets.forEach((row) => {
                const monthlyTarget = Math.floor(row.remaining_quota / 12); // Distribute evenly
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
              <TableHead className="flex-shrink-0 w-16 text-center text-xs font-bold text-gray-700 bg-blue-100 pl-6 py-2">
                #
              </TableHead>
              <TableHead className="min-w-[150px] text-xs font-bold text-gray-700 bg-blue-100 py-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-600" />
                  Measurement
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-right text-xs font-bold text-gray-700 bg-blue-100 py-2">
                <div className="flex items-center justify-end gap-1">
                  <CalendarDays className="w-3 h-3" />
                  Target
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-right text-xs font-bold text-blue-600 bg-blue-100 py-2">
                <div className="flex items-center justify-end gap-1">
                  <Target className="w-3 h-3" />
                  Usage
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-right text-xs font-bold text-emerald-600 bg-blue-100 py-2">
                <div className="flex items-center justify-end gap-1">
                  <Target className="w-3 h-3" />
                  Remain
                </div>
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-center text-xs font-bold text-gray-700 bg-blue-100 py-2">
                Unit
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-center text-xs font-bold text-gray-700 bg-blue-100 py-2">
                Main
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-center text-xs font-bold text-gray-700 bg-blue-100 py-2">
                Related
              </TableHead>
              {MONTHS.filter((m) => m.value !== 'all').map((month) => (
                <TableHead
                  key={month.value}
                  className="text-center py-2 bg-blue-100 border-blue-200 min-w-[100px] flex-shrink-0">
                  <div className="text-xs font-bold text-gray-700">{month.label}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredYearlyTargets.map((row, i) => (
              <React.Fragment key={row.id}>
                <TableRow
                  className={`${TABLE_COLORS.border.default} ${TABLE_COLORS.hover.blue} transition-colors group`}>
                  <TableCell
                    className={`text-center text-xs font-mono text-gray-400 font-bold pl-6 py-2 ${TABLE_COLORS.cell.rowNumber} flex-shrink-0 w-16`}>
                    {i + 1}
                  </TableCell>
                  <TableCell className={`py-2 ${TABLE_COLORS.cell.data} min-w-[150px]`}>
                    <p className={`text-sm ${TABLE_COLORS.text.measurement} leading-tight`}>
                      {row.measurement ?? '---'}
                    </p>
                  </TableCell>
                  <TableCell
                    className={`text-right py-2 ${TABLE_COLORS.cell.alternate} min-w-[100px] flex-shrink-0`}>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-bold ${TABLE_COLORS.text.target}`}>
                        {row.total_target.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className={`text-right py-2 ${TABLE_COLORS.cell.alternate} min-w-[100px] flex-shrink-0`}>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-bold ${TABLE_COLORS.text.usage}`}>
                        {row.used_quota.toLocaleString()}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell
                    className={`text-right py-2 ${TABLE_COLORS.cell.alternate} min-w-[100px] flex-shrink-0`}>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-bold ${TABLE_COLORS.text.remaining}`}>
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
                  {MONTHS.filter((m) => m.value !== 'all').map((month) => {
                    const monthValue = typeof month.value === 'number' ? month.value : 0;
                    const status = getTargetStatus(row.id, monthValue);
                    const StatusIcon =
                      status.icon === 'CheckCircle'
                        ? CheckCircle
                        : status.icon === 'Target'
                          ? Target
                          : Circle;
                    const mt = getMonthlyTarget(row.id, monthValue);

                    return (
                      <TableCell
                        key={month.value}
                        className={`text-center py-2 ${TABLE_COLORS.cell.data} ${TABLE_COLORS.border.light} min-w-[100px] flex-shrink-0`}>
                        <div className="flex flex-col items-center gap-1">
                          {canEdit ? (
                            <Input
                              type="number"
                              min="0"
                              max={row.remaining_quota}
                              className="w-20 h-8 text-center text-xs bg-white border-gray-200 focus:border-blue-400 font-mono mx-auto"
                              defaultValue={mt?.target?.toString() || ''}
                              onBlur={(e) => {
                                const value = parseFloat(e.target.value) || 0;
                                if (value > row.remaining_quota) {
                                  kpiNotifications.quotaExceeded(
                                    toast,
                                    row.remaining_quota.toLocaleString()
                                  );
                                  e.target.value = mt?.target?.toString() || '';
                                  return;
                                }
                                if (value !== (mt?.target || 0)) {
                                  saveMonthlyTarget(row.id, monthValue, value, undefined, toast);
                                }
                              }}
                            />
                          ) : (
                            <div className="font-mono text-xs font-bold text-gray-700 min-h-[32px] flex items-center justify-center">
                              {mt?.target?.toLocaleString() || '---'}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
