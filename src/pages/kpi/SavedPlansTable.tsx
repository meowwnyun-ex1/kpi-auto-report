import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableContainer, TABLE_STYLES } from '@/components/shared/TableContainer';
import { ActionPlan, MONTHS, STATUS_OPTIONS } from './ActionPlansTypes';

interface SavedPlansTableProps {
  savedPlans: ActionPlan[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onAddPlan: () => void;
  getStatusColor: (status: string) => string;
  CategoryIcon: React.ComponentType<{ className?: string }>;
}

export function SavedPlansTable({
  savedPlans,
  searchQuery,
  onSearchChange,
  onAddPlan,
  getStatusColor,
  CategoryIcon,
}: SavedPlansTableProps) {
  if (savedPlans.length === 0) return null;

  return (
    <TableContainer
      icon={CategoryIcon}
      title="Saved Action Plans"
      searchValue={searchQuery}
      onSearchChange={onSearchChange}
      searchPlaceholder="Search by key action, action plan, PIC, or status..."
      theme="blue"
      actions={
        <Button size="sm" variant="outline" onClick={onAddPlan}>
          <Plus className="h-4 w-4 mr-1" /> Add Row
        </Button>
      }
      totalCount={savedPlans.length}
      countUnit="plan">
      <div className="overflow-x-auto max-h-[300px]">
        <Table className="text-xs">
          <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 sticky top-0 z-10">
            <TableRow className={TABLE_STYLES.headerRow}>
              <TableHead
                className={`flex-shrink-0 w-12 bg-blue-50 ${TABLE_STYLES.headerCell} pl-6`}>
                #
              </TableHead>
              <TableHead
                className={`min-w-[150px] bg-blue-50 ${TABLE_STYLES.headerCell} flex-shrink-0`}>
                Key Action
              </TableHead>
              <TableHead
                className={`min-w-[150px] bg-blue-50 ${TABLE_STYLES.headerCell} flex-shrink-0`}>
                Action Plan
              </TableHead>
              <TableHead
                className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[80px] flex-shrink-0`}>
                PIC
              </TableHead>
              <TableHead
                className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px] flex-shrink-0`}>
                Period
              </TableHead>
              <TableHead
                className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px] flex-shrink-0`}>
                Status
              </TableHead>
              <TableHead
                className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px] flex-shrink-0`}>
                Progress
              </TableHead>
              <TableHead
                className={`min-w-[120px] bg-blue-50 ${TABLE_STYLES.headerCell} pr-6 flex-shrink-0`}>
                Updated
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {savedPlans
              .sort(
                (a, b) =>
                  new Date(b.updated_at ?? 0).getTime() - new Date(a.updated_at ?? 0).getTime()
              )
              .map((plan, idx) => (
                <TableRow key={idx} className={`${TABLE_STYLES.dataRow} hover:bg-blue-50/30`}>
                  <TableCell
                    className={`${TABLE_STYLES.rowNumber} bg-blue-50/50 flex-shrink-0 w-12`}>
                    {idx + 1}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate py-4 bg-white min-w-[150px] flex-shrink-0">
                    {plan.key_action}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate py-4 bg-gray-50/30 min-w-[150px] flex-shrink-0">
                    {plan.action_plan || '-'}
                  </TableCell>
                  <TableCell className="text-center py-4 bg-white min-w-[80px] flex-shrink-0">
                    {plan.person_in_charge || '-'}
                  </TableCell>
                  <TableCell className="text-center py-4 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                    {MONTHS[plan.start_month - 1]?.label} - {MONTHS[plan.end_month - 1]?.label}
                  </TableCell>
                  <TableCell className="text-center py-4 bg-white min-w-[100px] flex-shrink-0">
                    <Badge className={`${getStatusColor(plan.status)} text-white border-0`}>
                      {plan.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center py-4 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                    {plan.progress}%
                  </TableCell>
                  <TableCell className="text-center text-muted-foreground py-4 bg-white min-w-[120px] flex-shrink-0">
                    {plan.updated_at ? new Date(plan.updated_at).toLocaleDateString() : '-'}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </TableContainer>
  );
}
