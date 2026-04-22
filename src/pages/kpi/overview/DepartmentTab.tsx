import React, { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Building2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableContainer, TABLE_STYLES } from '@/components/shared/TableContainer';
import type { DepartmentData } from './types';

interface DepartmentTabProps {
  loading: boolean;
  departmentData: DepartmentData[];
}

export function DepartmentTab({ loading, departmentData }: DepartmentTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredDepartments = useMemo(() => {
    if (!searchQuery.trim()) {
      return departmentData;
    }
    const query = searchQuery.toLowerCase();
    return departmentData.filter((dept) => dept.name?.toLowerCase().includes(query));
  }, [departmentData, searchQuery]);

  if (loading) {
    return <TableContainer icon={Building2} title="Department Performance" theme="blue" loading />;
  }

  if (filteredDepartments.length === 0) {
    return (
      <TableContainer
        icon={Building2}
        title="Department Performance"
        theme="blue"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        searchPlaceholder="Search by department name..."
        empty
        emptyTitle={departmentData.length === 0 ? 'No Data' : 'No Results Found'}
        emptyDescription={
          departmentData.length === 0 ? 'No department data.' : 'Try adjusting your search terms.'
        }
      />
    );
  }

  return (
    <TableContainer
      icon={Building2}
      title="Department Performance"
      badge={`${filteredDepartments.length} departments`}
      searchValue={searchQuery}
      onSearchChange={setSearchQuery}
      searchPlaceholder="Search by department name..."
      theme="blue"
      legendItems={[
        { color: 'bg-blue-500', label: 'Target' },
        { color: 'bg-emerald-500', label: 'Result' },
      ]}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 sticky top-0 z-10">
            <TableRow className={TABLE_STYLES.headerRow}>
              <TableHead className={`w-12 bg-blue-50 ${TABLE_STYLES.headerCell} pl-6`}>#</TableHead>
              <TableHead className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[150px]`}>
                Department
              </TableHead>
              <TableHead
                className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px]`}>
                Target
              </TableHead>
              <TableHead
                className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} text-emerald-600 min-w-[100px]`}>
                Result
              </TableHead>
              <TableHead className={`bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[180px]`}>
                Progress
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredDepartments.map((dept, idx) => (
              <TableRow key={idx} className={`${TABLE_STYLES.dataRow} hover:bg-blue-50/30`}>
                <TableCell className={`${TABLE_STYLES.rowNumber} bg-blue-50/50`}>
                  {idx + 1}
                </TableCell>
                <TableCell className="font-medium py-4 bg-white">{dept.name}</TableCell>
                <TableCell className="text-center font-medium text-blue-600 py-4 bg-gray-50/30">
                  {dept.target}
                </TableCell>
                <TableCell className="text-center font-medium text-emerald-600 py-4 bg-emerald-50/30">
                  {dept.result}
                </TableCell>
                <TableCell className="py-4 bg-white">
                  <div className="flex items-center gap-2">
                    <Progress value={dept.rate} className="h-2 w-24" />
                    <span className="text-xs text-muted-foreground font-medium">
                      {dept.rate.toFixed(0)}%
                    </span>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
