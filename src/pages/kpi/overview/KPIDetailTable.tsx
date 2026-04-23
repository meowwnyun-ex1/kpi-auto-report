import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Table as TableIcon, Search } from 'lucide-react';
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronLeft,
  ChevronRight,
  X,
} from 'lucide-react';
import { TableContainer, TABLE_STYLES, type TableTheme } from '@/components/shared/TableContainer';
import type { KPIDetail, ColumnFilters } from './types';

interface KPIDetailTableProps {
  loading: boolean;
  kpiDetails: KPIDetail[];
  filteredDetails: KPIDetail[];
  paginatedDetails: KPIDetail[];
  columnFilters: ColumnFilters;
  setColumnFilters: (filters: ColumnFilters) => void;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
}

const getJudgeBadge = (ev: string | null) => {
  if (ev === 'O') {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-sm">
        O
      </span>
    );
  } else if (ev === 'X') {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-700 font-bold text-sm">
        X
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-100 text-gray-400 font-bold text-sm">
      X
    </span>
  );
};

export function KPIDetailTable({
  loading,
  kpiDetails,
  filteredDetails,
  paginatedDetails,
  columnFilters,
  setColumnFilters,
  currentPage,
  totalPages,
  setCurrentPage,
  hasActiveFilters,
  clearFilters,
}: KPIDetailTableProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter details based on column filters and search
  const filteredDetailsWithSearch = useMemo(() => {
    if (!searchQuery.trim()) {
      return filteredDetails;
    }
    const query = searchQuery.toLowerCase();
    return filteredDetails.filter(
      (row) =>
        row.department_name?.toLowerCase().includes(query) ||
        row.measurement?.toLowerCase().includes(query) ||
        row.unit?.toLowerCase().includes(query) ||
        row.ev?.toLowerCase().includes(query)
    );
  }, [filteredDetails, searchQuery]);

  // Recalculate pagination with search results
  const pageSize = 100;
  const totalPagesWithSearch = Math.ceil(filteredDetailsWithSearch.length / pageSize);
  const paginatedDetailsWithSearch = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredDetailsWithSearch.slice(startIndex, startIndex + pageSize);
  }, [filteredDetailsWithSearch, currentPage]);

  // Get unique values for filters
  const departments = useMemo(
    () => [...new Set(kpiDetails.map((d) => d.department_name))].sort(),
    [kpiDetails]
  );
  const measurements = useMemo(
    () => [...new Set(kpiDetails.map((d) => d.measurement))].sort(),
    [kpiDetails]
  );
  const units = useMemo(
    () => [...new Set(kpiDetails.map((d) => d.unit || 'Other'))].sort(),
    [kpiDetails]
  );

  if (loading) {
    return <TableContainer icon={TableIcon} title="KPI Details" theme="purple" loading />;
  }

  if (kpiDetails.length === 0) {
    return (
      <TableContainer
        icon={TableIcon}
        title="KPI Details"
        theme="purple"
        empty
        emptyTitle="No KPI Data"
        emptyDescription="No KPI data found."
      />
    );
  }

  const cfg = {
    headerGradient: 'bg-gradient-to-r from-purple-50 to-violet-100',
    headerCellBg: 'bg-purple-50',
    rowHover: 'hover:bg-purple-50/30',
    rowNumberBg: 'bg-purple-50/50',
  };

  return (
    <TableContainer
      icon={TableIcon}
      title="KPI Details"
      subtitle="Performance detail with target vs result comparison"
      badge={`${filteredDetailsWithSearch.length} items`}
      totalCount={filteredDetailsWithSearch.length}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by department, measurement, unit, or judge..."
      theme="purple"
      legendItems={[
        { color: 'bg-green-500', label: 'Pass' },
        { color: 'bg-red-500', label: 'Fail' },
      ]}
      searchActions={
        hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-xs">
            <X className="h-3 w-3 mr-1" />
            Clear Filters
          </Button>
        )
      }>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className={`${cfg.headerGradient} sticky top-0 z-10`}>
            <TableRow className={TABLE_STYLES.headerRow}>
              <TableHead className={`w-12 ${cfg.headerCellBg} ${TABLE_STYLES.headerCell} pl-6`}>
                #
              </TableHead>
              <TableHead
                className={`text-left ${cfg.headerCellBg} ${TABLE_STYLES.headerCell} min-w-[150px]`}>
                <Select
                  value={columnFilters.department || 'all'}
                  onValueChange={(v) => {
                    setColumnFilters({ ...columnFilters, department: v === 'all' ? '' : v });
                    setCurrentPage(1);
                  }}>
                  <SelectTrigger className="h-auto text-xs font-medium border-0 bg-transparent hover:bg-muted p-0 w-auto shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden cursor-pointer">
                    <span className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap">
                      Department
                      <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead className={`${cfg.headerCellBg} ${TABLE_STYLES.headerCell} min-w-[250px]`}>
                <Select
                  value={columnFilters.measurement || 'all'}
                  onValueChange={(v) => {
                    setColumnFilters({ ...columnFilters, measurement: v === 'all' ? '' : v });
                    setCurrentPage(1);
                  }}>
                  <SelectTrigger className="h-auto text-xs font-medium border-0 bg-transparent hover:bg-muted p-0 w-auto shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden cursor-pointer">
                    <span className="flex items-center gap-1 hover:text-primary transition-colors whitespace-nowrap">
                      Measurement
                      <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
                    </span>
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="all">All Measurements</SelectItem>
                    {measurements.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead
                className={`text-center ${cfg.headerCellBg} ${TABLE_STYLES.headerCell} min-w-[80px]`}>
                <Select
                  value={columnFilters.unit || 'all'}
                  onValueChange={(v) => {
                    setColumnFilters({ ...columnFilters, unit: v === 'all' ? '' : v });
                    setCurrentPage(1);
                  }}>
                  <SelectTrigger className="h-auto text-xs font-medium border-0 bg-transparent hover:bg-purple-200 p-0 w-auto shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden cursor-pointer">
                    <span className="flex items-center justify-center gap-1 hover:text-primary transition-colors whitespace-nowrap">
                      Unit
                      <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {units.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead
                className={`text-center ${cfg.headerCellBg} ${TABLE_STYLES.headerCell} min-w-[100px]`}>
                <div className="flex items-center justify-end gap-1">Target</div>
              </TableHead>
              <TableHead
                className={`text-center ${cfg.headerCellBg} ${TABLE_STYLES.headerCell} text-emerald-600 min-w-[100px]`}>
                <div className="flex items-center justify-end gap-1">Result</div>
              </TableHead>
              <TableHead
                className={`text-center ${cfg.headerCellBg} ${TABLE_STYLES.headerCell} min-w-[90px]`}>
                <Select
                  value={columnFilters.judge || 'all'}
                  onValueChange={(v) => {
                    setColumnFilters({ ...columnFilters, judge: v === 'all' ? '' : v });
                    setCurrentPage(1);
                  }}>
                  <SelectTrigger className="h-auto text-xs font-medium border-0 bg-transparent hover:bg-purple-200 p-0 w-auto shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden cursor-pointer">
                    <span className="flex items-center justify-center gap-1 hover:text-primary transition-colors whitespace-nowrap">
                      Judge
                      <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                    <SelectItem value="X">X</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>
              <TableHead
                className={`text-center ${cfg.headerCellBg} ${TABLE_STYLES.headerCell} min-w-[120px]`}>
                Accu. Target
              </TableHead>
              <TableHead
                className={`text-center ${cfg.headerCellBg} ${TABLE_STYLES.headerCell} text-emerald-600 min-w-[120px]`}>
                Accu. Result
              </TableHead>
              <TableHead
                className={`text-center ${cfg.headerCellBg} ${TABLE_STYLES.headerCell} min-w-[110px]`}>
                <Select
                  value={columnFilters.accu_judge || 'all'}
                  onValueChange={(v) => {
                    setColumnFilters({ ...columnFilters, accu_judge: v === 'all' ? '' : v });
                    setCurrentPage(1);
                  }}>
                  <SelectTrigger className="h-auto text-xs font-medium border-0 bg-transparent hover:bg-purple-200 p-0 w-auto shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:hidden cursor-pointer">
                    <span className="flex items-center justify-center gap-1 hover:text-primary transition-colors whitespace-nowrap">
                      Accu. Judge
                      <ChevronDown className="h-3 w-3 opacity-50 flex-shrink-0" />
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="O">O</SelectItem>
                    <SelectItem value="X">X</SelectItem>
                  </SelectContent>
                </Select>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedDetailsWithSearch.map((row, idx) => {
              const targetValue = row.target ?? row.dept_quota ?? row.total_quota ?? row.fy_target;
              const accuTarget = row.accu_target ?? 0;
              const accuResult = row.accu_result ?? 0;
              const accuJudge = accuResult >= accuTarget ? 'O' : 'X';

              return (
                <TableRow
                  key={idx}
                  className={`${TABLE_STYLES.dataRow} ${cfg.rowHover} ${
                    row.ev === 'O' ? 'bg-green-50/30' : row.ev === 'X' ? 'bg-red-50/30' : ''
                  }`}>
                  <TableCell className={`${TABLE_STYLES.rowNumber} ${cfg.rowNumberBg}`}>
                    {(currentPage - 1) * pageSize + idx + 1}
                  </TableCell>
                  <TableCell className="font-medium sticky left-0 bg-background z-10">
                    {row.department_name}
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">{row.measurement}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="text-xs">
                      {row.unit || '-'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium text-blue-600">
                    {targetValue ?? '-'}
                  </TableCell>
                  <TableCell className="text-center font-medium text-emerald-600">
                    {row.result ?? '-'}
                  </TableCell>
                  <TableCell className="text-center">{getJudgeBadge(row.ev ?? null)}</TableCell>
                  <TableCell className="text-center font-medium text-blue-700">
                    {accuTarget.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center font-medium text-emerald-700">
                    {accuResult.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">{getJudgeBadge(accuJudge)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
