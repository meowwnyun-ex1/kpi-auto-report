import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
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
import { Save, Loader2, Trash2 } from 'lucide-react';
import { TableContainer, TABLE_STYLES } from '@/components/shared/TableContainer';
import { ActionPlan, MONTHS, STATUS_OPTIONS } from './ActionPlansTypes';

interface ActionPlansTableProps {
  actionPlans: ActionPlan[];
  canEdit: boolean;
  saving: boolean;
  onSave: () => void;
  onUpdatePlan: (index: number, field: keyof ActionPlan, value: string | number) => void;
  onRemovePlan: (index: number) => void;
  CategoryIcon: React.ComponentType<{ className?: string }>;
  categoryColor?: string;
  validPlansCount: number;
  loading: boolean;
  employees: { employee_id: string; name_en: string; name_th?: string }[];
}

export function ActionPlansTable({
  actionPlans,
  canEdit,
  saving,
  onSave,
  onUpdatePlan,
  onRemovePlan,
  CategoryIcon,
  categoryColor,
  validPlansCount,
  loading,
  employees,
}: ActionPlansTableProps) {
  return (
    <TableContainer
      icon={CategoryIcon}
      title="Action Plans"
      theme="blue"
      iconColor={categoryColor}
      actions={
        canEdit && (
          <Button size="sm" onClick={onSave} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save
          </Button>
        )
      }
      totalCount={validPlansCount}
      countUnit="plan">
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader className="bg-gradient-to-r from-blue-50 to-indigo-100 sticky top-0 z-10">
              <TableRow className={TABLE_STYLES.headerRow}>
                <TableHead
                  className={`min-w-[150px] bg-blue-50 ${TABLE_STYLES.headerCell} pl-6 flex-shrink-0`}>
                  <span className="font-medium">Key Action</span>
                </TableHead>
                <TableHead
                  className={`min-w-[150px] bg-blue-50 ${TABLE_STYLES.headerCell} flex-shrink-0`}>
                  <span className="font-medium">Action Plan</span>
                </TableHead>
                <TableHead
                  className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[80px] flex-shrink-0`}>
                  <span className="font-medium">PIC</span>
                </TableHead>
                <TableHead
                  className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[60px] flex-shrink-0`}>
                  <span className="font-medium">Start</span>
                </TableHead>
                <TableHead
                  className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[60px] flex-shrink-0`}>
                  <span className="font-medium">End</span>
                </TableHead>
                <TableHead
                  className={`text-center bg-purple-50 ${TABLE_STYLES.headerCell} min-w-[100px] flex-shrink-0`}>
                  <span className="font-medium">Status</span>
                </TableHead>
                <TableHead
                  className={`text-center bg-blue-50 ${TABLE_STYLES.headerCell} min-w-[100px] flex-shrink-0`}>
                  <span className="font-medium">Progress</span>
                </TableHead>
                {canEdit && (
                  <TableHead
                    className={`flex-shrink-0 w-12 bg-blue-50 ${TABLE_STYLES.headerCell} pr-6`}
                  />
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {actionPlans.map((row, i) => (
                <TableRow key={i} className={`${TABLE_STYLES.dataRow} hover:bg-blue-50/30`}>
                  <TableCell className="py-4 bg-white min-w-[150px] flex-shrink-0">
                    <Input
                      value={row.key_action}
                      onChange={(e) => onUpdatePlan(i, 'key_action', e.target.value)}
                      disabled={!canEdit}
                      className="h-8"
                      placeholder="Key action..."
                    />
                  </TableCell>
                  <TableCell className="py-4 bg-gray-50/30 min-w-[150px] flex-shrink-0">
                    <Input
                      value={row.action_plan}
                      onChange={(e) => onUpdatePlan(i, 'action_plan', e.target.value)}
                      disabled={!canEdit}
                      className="h-8"
                      placeholder="Action plan..."
                    />
                  </TableCell>
                  <TableCell className="text-center py-4 bg-white min-w-[80px] flex-shrink-0">
                    <Select
                      value={row.person_in_charge}
                      onValueChange={(v) => onUpdatePlan(i, 'person_in_charge', v)}
                      disabled={!canEdit}>
                      <SelectTrigger className="h-8 w-24">
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-</SelectItem>
                        {employees.map((emp) => (
                          <SelectItem key={emp.employee_id} value={emp.employee_id}>
                            {emp.name_en}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-center py-4 bg-gray-50/30 min-w-[60px] flex-shrink-0">
                    <Select
                      value={row.start_month.toString()}
                      onValueChange={(v) => onUpdatePlan(i, 'start_month', parseInt(v))}
                      disabled={!canEdit}>
                      <SelectTrigger className="h-8 w-16">
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
                  </TableCell>
                  <TableCell className="text-center py-4 bg-white min-w-[60px] flex-shrink-0">
                    <Select
                      value={row.end_month.toString()}
                      onValueChange={(v) => onUpdatePlan(i, 'end_month', parseInt(v))}
                      disabled={!canEdit}>
                      <SelectTrigger className="h-8 w-16">
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
                  </TableCell>
                  <TableCell className="text-center py-4 bg-gray-50/30 min-w-[100px] flex-shrink-0">
                    <Select
                      value={row.status}
                      onValueChange={(v) => onUpdatePlan(i, 'status', v)}
                      disabled={!canEdit}>
                      <SelectTrigger className="h-8 w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.value}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="py-4 bg-white min-w-[100px] flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <Progress value={row.progress} className="flex-1 h-2" />
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={row.progress}
                        onChange={(e) => onUpdatePlan(i, 'progress', parseInt(e.target.value) || 0)}
                        disabled={!canEdit}
                        className="h-8 w-12"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </TableCell>
                  {canEdit && (
                    <TableCell
                      className={`${TABLE_STYLES.actionCell} bg-gray-50/30 flex-shrink-0 w-12`}>
                      <Button size="sm" variant="ghost" onClick={() => onRemovePlan(i)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </TableContainer>
  );
}
