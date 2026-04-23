import React, { useState, useMemo } from 'react';
import { AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableContainer, TABLE_STYLES } from '@/components/shared/TableContainer';
import type { KPIDetail } from './types';

interface MissingTabProps {
  loading: boolean;
  kpiDetails: KPIDetail[];
}

export function MissingTab({ loading, kpiDetails }: MissingTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const missingKPIs = useMemo(() => {
    const baseMissing = kpiDetails.filter((d) => !d.result);
    if (!searchQuery.trim()) {
      return baseMissing;
    }
    const query = searchQuery.toLowerCase();
    return baseMissing.filter(
      (kpi) =>
        kpi.department_name?.toLowerCase().includes(query) ||
        kpi.measurement?.toLowerCase().includes(query) ||
        kpi.unit?.toLowerCase().includes(query)
    );
  }, [kpiDetails, searchQuery]);

  if (loading) {
    return <TableContainer icon={AlertCircle} title="Missing KPI Data" theme="red" loading />;
  }

  const baseMissing = kpiDetails.filter((d) => !d.result);

  if (missingKPIs.length === 0) {
    return (
      <TableContainer
        icon={AlertCircle}
        title="Missing KPI Data"
        theme="red"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by department, measurement, or unit..."
        empty
        emptyTitle={baseMissing.length === 0 ? 'All Complete' : 'No Results Found'}
        emptyDescription={
          baseMissing.length === 0
            ? 'All KPIs have been filled!'
            : 'Try adjusting your search terms.'
        }
      />
    );
  }

  return (
    <TableContainer
      icon={AlertCircle}
      title="Missing KPI Data"
      badge={`${missingKPIs.length} items`}
      totalCount={missingKPIs.length}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by department, measurement, or unit..."
      theme="red"
      legendItems={[
        { color: 'bg-red-500', label: 'Missing' },
        { color: 'bg-blue-500', label: 'Target' },
      ]}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gradient-to-r from-red-50 to-rose-100 sticky top-0 z-10">
            <TableRow className={TABLE_STYLES.headerRow}>
              <TableHead className={`w-12 bg-red-50 ${TABLE_STYLES.headerCell} pl-6`}>#</TableHead>
              <TableHead className={`bg-red-50 ${TABLE_STYLES.headerCell} min-w-[150px]`}>
                Department
              </TableHead>
              <TableHead className={`bg-red-50 ${TABLE_STYLES.headerCell} min-w-[250px]`}>
                Measurement
              </TableHead>
              <TableHead
                className={`text-center bg-red-50 ${TABLE_STYLES.headerCell} min-w-[80px]`}>
                Unit
              </TableHead>
              <TableHead
                className={`text-center bg-red-50 ${TABLE_STYLES.headerCell} min-w-[100px]`}>
                Target
              </TableHead>
              <TableHead className={`bg-red-50 ${TABLE_STYLES.headerCell} min-w-[100px]`}>
                Status
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missingKPIs.map((row, idx) => (
              <TableRow
                key={idx}
                className={`${TABLE_STYLES.dataRow} hover:bg-red-50/30 bg-red-50/30`}>
                <TableCell className={`${TABLE_STYLES.rowNumber} bg-red-50/50`}>
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium py-4 bg-white">{row.department_name}</TableCell>
                <TableCell className="max-w-[300px] truncate py-4 bg-white">
                  {row.measurement}
                </TableCell>
                <TableCell className="text-center py-4 bg-gray-50/30">
                  <Badge variant="outline" className="text-xs">
                    {row.unit || '-'}
                  </Badge>
                </TableCell>
                <TableCell className="text-center font-medium text-blue-600 py-4 bg-gray-50/30">
                  {row.target ?? '-'}
                </TableCell>
                <TableCell className="py-4 bg-white">
                  <Badge variant="destructive">Missing</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
