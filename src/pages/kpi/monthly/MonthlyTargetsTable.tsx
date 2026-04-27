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
import { TABLE_COLORS } from '@/shared/constants/colors';
import { TableContainer } from '@/shared/components/TableContainer';
import { MONTHS } from '../shared';
import { YearlyTarget } from '../shared';
import { kpiNotifications } from '@/shared/constants/notifications';

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
              // Fill all rows with equal distribution
              filteredYearlyTargets.forEach((row) => {
                const setMonths = MONTHS.filter((m) => {
                  const mt = getMonthlyTarget(row.id, m.value);
                  return mt?.target;
                }).length;
                const remainingMonths = 12 - setMonths;
                const monthlyTarget =
                  remainingMonths > 0 ? Math.floor(row.remaining_quota / remainingMonths) : 0;
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
              {MONTHS.map((month) => (
                <TableHead
                  key={month.value}
                  className="text-center py-3 bg-gradient-to-b from-blue-100 to-blue-50 border-l-2 border-blue-300 min-w-[110px] flex-shrink-0">
                  <div className="flex flex-col items-center">
                    <div className="text-xs font-bold text-black">{month.label}</div>
                  </div>
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
                  <TableCell className={`py-2 ${TABLE_COLORS.cell.data} min-w-[120px]`}>
                    <p className="text-sm text-blue-600 leading-tight">
                      {row.sub_category_name ?? '---'}
                    </p>
                  </TableCell>
                  <TableCell
                    className={`text-right py-2 ${TABLE_COLORS.cell.alternate} min-w-[100px] flex-shrink-0`}>
                    <div className="text-right">
                      <div className={`font-mono text-sm font-bold text-cyan-600`}>
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

                    return (
                      <TableCell
                        key={month.value}
                        className={`text-center py-3 ${TABLE_COLORS.cell.data} border-l-2 border-blue-200 min-w-[110px] flex-shrink-0`}>
                        <div className="flex flex-col items-center">
                          {canEdit ? (
                            <Input
                              type="number"
                              min="0"
                              max={row.total_target}
                              className="w-20 h-8 text-center text-xs bg-white border-blue-200 focus:border-blue-400 font-mono mx-auto"
                              defaultValue={mt?.target?.toString() || ''}
                              onBlur={(e) => {
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
                                  saveMonthlyTarget(row.id, monthValue, value, undefined, toast);
                                }
                              }}
                            />
                          ) : (
                            <div
                              className={`font-mono text-xs font-bold px-2 py-1 rounded min-h-[32px] flex items-center justify-center ${
                                mt?.target === 0 || !mt?.target
                                  ? 'text-gray-400 bg-gray-50'
                                  : 'text-cyan-600 bg-cyan-50'
                              }`}>
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
