import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, Target, Loader2, CalendarDays } from 'lucide-react';
import { TableContainer } from '@/components/shared/TableContainer';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { MONTHS } from '../shared';
import { MonthlyResultRow } from './useMonthlyResultData';
import { kpiNotifications } from '@/constants/notifications';

interface MonthlyResultTableProps {
  filteredRows: MonthlyResultRow[];
  loading: boolean;
  canEdit: boolean;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  selectedCatName: string;
  onChange: (yearlyTargetId: number, month: number, value: string) => void;
  onChangeResult: (yearlyTargetId: number, month: number, value: string) => void;
  saveMonthResult: (yearlyTargetId: number, month: number, monthData: any, toast: any) => void;
  toast: any;
}

export function MonthlyResultTable({
  filteredRows,
  loading,
  canEdit,
  searchQuery,
  setSearchQuery,
  selectedCatName,
  onChange,
  onChangeResult,
  saveMonthResult,
  toast,
}: MonthlyResultTableProps) {
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
              <TableHead className="flex-shrink-0 w-16 text-center text-xs font-bold text-gray-700 bg-emerald-100 pl-6 py-2">
                #
              </TableHead>
              <TableHead className="min-w-[150px] text-xs font-bold text-gray-700 bg-emerald-100 py-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-600" />
                  Measurement
                </div>
              </TableHead>
              <TableHead className="min-w-[100px] flex-shrink-0 text-right text-xs font-bold text-gray-700 bg-emerald-100 py-2">
                <div className="flex items-center justify-end gap-1">
                  <CalendarDays className="w-3 h-3" />
                  FY Target
                </div>
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-right text-xs font-bold text-gray-700 bg-emerald-100 py-2">
                Used
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-right text-xs font-bold text-gray-700 bg-emerald-100 py-2">
                Remaining
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-center text-xs font-bold text-gray-700 bg-emerald-100 py-2">
                Unit
              </TableHead>
              <TableHead className="min-w-[80px] flex-shrink-0 text-center text-xs font-bold text-gray-700 bg-emerald-100 py-2">
                Main
              </TableHead>
              {MONTHS.filter((m) => m.value !== 'all').map((m) => (
                <TableHead
                  key={m.value}
                  className="min-w-[120px] flex-shrink-0 text-center text-xs font-bold text-gray-700 bg-emerald-100 py-2">
                  <div className="text-xs font-bold">{m.label}</div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row, i) => (
              <TableRow
                key={row.yearly_target_id}
                className="border-b border-gray-200 hover:bg-emerald-50 transition-colors">
                <TableCell className="text-center text-xs font-mono text-gray-400 font-bold pl-6 py-2 bg-emerald-50/50 flex-shrink-0 w-16">
                  {i + 1}
                </TableCell>
                <TableCell className="py-2 min-w-[150px]">
                  <p className="text-sm text-gray-700 leading-tight">{row.measurement ?? '---'}</p>
                </TableCell>
                <TableCell className="text-right py-2 bg-emerald-50/50 min-w-[100px] flex-shrink-0">
                  <div className="font-mono text-sm font-bold text-blue-600">
                    {row.fy_target?.toLocaleString() || '---'}
                  </div>
                </TableCell>
                <TableCell className="text-right py-2 bg-emerald-50/50 min-w-[80px] flex-shrink-0">
                  <div className="font-mono text-sm font-bold text-orange-600">
                    {row.used_quota?.toLocaleString() || '0'}
                  </div>
                </TableCell>
                <TableCell className="text-right py-2 bg-emerald-50/50 min-w-[80px] flex-shrink-0">
                  <div className="font-mono text-sm font-bold text-emerald-600">
                    {row.remaining_quota?.toLocaleString() ||
                      row.fy_target?.toLocaleString() ||
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
                {MONTHS.filter((m) => m.value !== 'all').map((m) => {
                  const monthValue = typeof m.value === 'number' ? m.value : 0;
                  const monthData = row.months[monthValue];
                  return (
                    <TableCell
                      key={m.value}
                      className="text-center py-2 min-w-[120px] flex-shrink-0">
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-1">
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-blue-600 font-medium">T</span>
                            {canEdit ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-20 h-6 text-center text-[10px] bg-blue-50 border-blue-200 mx-auto"
                                value={monthData?.draft || ''}
                                onChange={(e) =>
                                  onChange(row.yearly_target_id, monthValue, e.target.value)
                                }
                                placeholder="0"
                              />
                            ) : (
                              <div className="font-mono text-[10px] text-blue-600">
                                {monthData?.target?.toLocaleString() || '---'}
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col items-center">
                            <span className="text-[10px] text-orange-600 font-medium">R</span>
                            {canEdit ? (
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                className="w-20 h-6 text-center text-[10px] bg-orange-50 border-orange-200 mx-auto"
                                value={monthData?.draftResult || ''}
                                onChange={(e) =>
                                  onChangeResult(row.yearly_target_id, monthValue, e.target.value)
                                }
                                placeholder="0"
                              />
                            ) : (
                              <div className="font-mono text-[10px] text-orange-600">
                                {monthData?.result?.toLocaleString() || '---'}
                              </div>
                            )}
                          </div>
                        </div>
                        {(monthData?.dirty || monthData?.dirtyResult) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className={`h-5 px-2 text-[9px] border-emerald-200 hover:bg-emerald-50`}
                            onClick={() =>
                              saveMonthResult(row.yearly_target_id, monthValue, monthData, toast)
                            }
                            disabled={monthData?.saving}>
                            {monthData?.saving ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Save className="w-3 h-3" />
                            )}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
