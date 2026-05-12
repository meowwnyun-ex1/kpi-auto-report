/**
 * Result Grid Table Component
 * Grid view showing all 12 months for each measurement with inline editing
 */

import * as React from 'react';
import { useState, useCallback } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/design-system/components/ui/button';
import { Badge } from '@/design-system/components/ui/badge';
import { Input } from '@/design-system/components/ui/input';
import { Card } from '@/design-system/components/ui/card';
import { Check, X, Edit2, Save, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';

// ============================================
// TYPES
// ============================================

export interface MonthResult {
  month: number;
  monthName: string;
  targetValue: number;
  resultValue?: number;
  achievementRate?: number;
  status: 'draft' | 'submitted' | 'verified' | 'rejected';
  isBelowTarget?: boolean;
}

export interface MeasurementRow {
  id: string;
  category: string;
  measurement: string;
  unit: string;
  yearlyTarget: number;
  months: MonthResult[];
}

export interface ResultGridTableProps {
  data: MeasurementRow[];
  loading?: boolean;
  currentUserRole?: 'admin' | 'manager' | 'user';
  fiscalYear: number;
  department: string;
  onUpdateResult: (measurementId: string, month: number, resultValue: number) => Promise<void>;
  onSubmitMeasurement?: (measurementId: string) => void;
  onDeclareResult?: (measurementId: string, month: number, reason: string) => void;
}

// ============================================
// MONTHLY INPUT CELL COMPONENT
// ============================================

interface MonthCellProps {
  data: MonthResult;
  measurementId: string;
  unit: string;
  canEdit: boolean;
  onUpdate: (value: number) => Promise<void>;
  onDeclare?: (reason: string) => void;
}

const MonthCell: React.FC<MonthCellProps> = ({
  data,
  measurementId,
  unit,
  canEdit,
  onUpdate,
  onDeclare,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.resultValue?.toString() || '');
  const [isSaving, setIsSaving] = useState(false);
  const [showDeclareModal, setShowDeclareModal] = useState(false);
  const [declareReason, setDeclareReason] = useState('');

  const handleSave = async () => {
    const value = parseFloat(editValue);
    if (isNaN(value)) {
      setEditValue(data.resultValue?.toString() || '');
      setIsEditing(false);
      return;
    }

    if (value !== data.resultValue) {
      setIsSaving(true);
      try {
        await onUpdate(value);
      } finally {
        setIsSaving(false);
      }
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setEditValue(data.resultValue?.toString() || '');
      setIsEditing(false);
    }
  };

  const handleDeclareSubmit = () => {
    if (declareReason.trim() && onDeclare) {
      onDeclare(declareReason);
      setShowDeclareModal(false);
      setDeclareReason('');
    }
  };

  const achievementColor = data.achievementRate !== undefined
    ? data.achievementRate >= 100
      ? 'text-emerald-600'
      : data.achievementRate >= 80
        ? 'text-amber-600'
        : 'text-red-600'
    : 'text-muted-foreground';

  const bgColor = data.status === 'verified'
    ? 'bg-emerald-50/50'
    : data.status === 'submitted'
      ? 'bg-blue-50/50'
      : data.status === 'rejected'
        ? 'bg-red-50/50'
        : 'bg-white';

  if (isEditing && canEdit) {
    return (
      <div className="relative">
        <Input
          type="number"
          step="0.01"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className={cn(
            "w-full h-9 text-right pr-8 text-sm",
            isSaving && "opacity-70"
          )}
          disabled={isSaving}
        />
        {isSaving && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div
        onClick={() => canEdit && setIsEditing(true)}
        className={cn(
          "group relative p-2 rounded-md cursor-pointer transition-all",
          "hover:bg-muted/50 border border-transparent hover:border-border",
          bgColor,
          !canEdit && "cursor-default hover:bg-transparent hover:border-transparent"
        )}
      >
        {/* Result Value */}
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "font-mono text-sm font-medium",
            data.resultValue === undefined ? "text-muted-foreground" : "text-foreground"
          )}>
            {data.resultValue !== undefined ? data.resultValue.toLocaleString() : '-'}
          </span>
          {canEdit && data.status !== 'verified' && (
            <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>

        {/* Target & Achievement */}
        <div className="mt-1 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            Target: {data.targetValue.toLocaleString()} {unit}
          </span>
          {data.achievementRate !== undefined && (
            <span className={cn("font-medium", achievementColor)}>
              {data.achievementRate}%
            </span>
          )}
        </div>

        {/* Status Indicator */}
        <div className="mt-1 flex items-center gap-1">
          {data.status === 'verified' && (
            <Badge variant="success" className="text-[10px] px-1 py-0">Verified</Badge>
          )}
          {data.status === 'submitted' && (
            <Badge variant="info" className="text-[10px] px-1 py-0">Pending</Badge>
          )}
          {data.isBelowTarget && data.status !== 'verified' && (
            <Badge variant="warning" className="text-[10px] px-1 py-0">
              <AlertCircle className="w-3 h-3 mr-1" />
              Below
            </Badge>
          )}
        </div>

        {/* Declare Button for Below Target */}
        {canEdit && data.isBelowTarget && data.status === 'draft' && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute -top-1 -right-1 h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
            onClick={(e) => {
              e.stopPropagation();
              setShowDeclareModal(true);
            }}
          >
            <AlertCircle className="w-3 h-3 text-amber-500" />
          </Button>
        )}
      </div>

      {/* Declare Modal */}
      {showDeclareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-2">Declare Result</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {data.monthName}: Result {data.resultValue} {unit} is below target {data.targetValue} {unit}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Explanation</label>
                <textarea
                  className="w-full p-2 border border-border rounded-md min-h-[100px]"
                  value={declareReason}
                  onChange={(e) => setDeclareReason(e.target.value)}
                  placeholder="Explain the reason for not meeting the target..."
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowDeclareModal(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleDeclareSubmit}
                  disabled={!declareReason.trim()}
                >
                  Submit Declaration
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </>
  );
};

// ============================================
// SUMMARY CARD COMPONENT
// ============================================

interface SummaryCardProps {
  data: MeasurementRow[];
}

const SummaryCard: React.FC<SummaryCardProps> = ({ data }) => {
  const stats = React.useMemo(() => {
    let totalCells = 0;
    let filledCells = 0;
    let verifiedCells = 0;
    let belowTargetCells = 0;

    data.forEach(row => {
      row.months.forEach(month => {
        totalCells++;
        if (month.resultValue !== undefined) filledCells++;
        if (month.status === 'verified') verifiedCells++;
        if (month.isBelowTarget) belowTargetCells++;
      });
    });

    return {
      totalCells,
      filledCells,
      fillRate: totalCells > 0 ? Math.round((filledCells / totalCells) * 100) : 0,
      verifiedCells,
      belowTargetCells,
    };
  }, [data]);

  return (
    <Card className="p-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {data.length}
          </div>
          <div className="text-sm text-muted-foreground">Measurements</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-emerald-600">
            {stats.verifiedCells}
          </div>
          <div className="text-sm text-muted-foreground">Verified</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {stats.filledCells}/{stats.totalCells}
          </div>
          <div className="text-sm text-muted-foreground">Filled</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-amber-600">
            {stats.belowTargetCells}
          </div>
          <div className="text-sm text-muted-foreground">Below Target</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {stats.fillRate}%
          </div>
          <div className="text-sm text-muted-foreground">Fill Rate</div>
        </div>
      </div>
    </Card>
  );
};

// ============================================
// MAIN RESULT GRID TABLE COMPONENT
// ============================================

export const ResultGridTable: React.FC<ResultGridTableProps> = ({
  data,
  loading = false,
  currentUserRole = 'user',
  fiscalYear,
  department,
  onUpdateResult,
  onSubmitMeasurement,
  onDeclareResult,
}) => {
  const canEdit = currentUserRole === 'user' || currentUserRole === 'manager';

  const monthNames = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];

  const handleUpdateResult = useCallback(async (
    measurementId: string,
    month: number,
    value: number
  ) => {
    await onUpdateResult(measurementId, month, value);
  }, [onUpdateResult]);

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="text-muted-foreground">Loading results...</span>
        </div>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="p-8">
        <div className="text-center text-muted-foreground">
          <p className="text-lg font-medium mb-2">No measurements found</p>
          <p className="text-sm">
            Please select a department and fiscal year to view results
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <SummaryCard data={data} />

      {/* Grid Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-muted/50 border-b">
                <th className="px-4 py-3 text-left font-semibold text-sm sticky left-0 bg-muted/50 z-10 min-w-[200px]">
                  Category / Measurement
                </th>
                <th className="px-2 py-3 text-center font-semibold text-sm w-20">
                  Unit
                </th>
                <th className="px-2 py-3 text-center font-semibold text-sm w-24">
                  Yearly Target
                </th>
                {monthNames.map((month, idx) => (
                  <th
                    key={month}
                    className={cn(
                      "px-1 py-3 text-center font-semibold text-xs w-28",
                      idx >= 9 && "bg-blue-50/30" // Highlight fiscal year months (Jan-Mar)
                    )}
                  >
                    <div className="flex flex-col items-center">
                      <span>{month}</span>
                      <span className="text-[10px] text-muted-foreground font-normal">
                        {idx >= 9 ? fiscalYear + 1 : fiscalYear}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="px-2 py-3 text-center font-semibold text-sm w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={cn(
                    "border-b hover:bg-muted/25 transition-colors",
                    rowIndex % 2 === 0 ? "bg-white" : "bg-muted/10"
                  )}
                >
                  {/* Category & Measurement */}
                  <td className="px-4 py-2 sticky left-0 bg-white z-10 border-r">
                    <div className="space-y-1">
                      <Badge variant="secondary" className="text-xs">
                        {row.category}
                      </Badge>
                      <p className="font-medium text-sm">{row.measurement}</p>
                    </div>
                  </td>

                  {/* Unit */}
                  <td className="px-2 py-2 text-center text-sm text-muted-foreground">
                    {row.unit}
                  </td>

                  {/* Yearly Target */}
                  <td className="px-2 py-2 text-center font-mono text-sm">
                    {row.yearlyTarget.toLocaleString()}
                  </td>

                  {/* Monthly Cells */}
                  {row.months.map((month, idx) => (
                    <td
                      key={month.month}
                      className={cn(
                        "px-1 py-1",
                        idx >= 9 && "bg-blue-50/20"
                      )}
                    >
                      <MonthCell
                        data={month}
                        measurementId={row.id}
                        unit={row.unit}
                        canEdit={canEdit && month.status !== 'verified'}
                        onUpdate={(value) => handleUpdateResult(row.id, month.month, value)}
                        onDeclare={onDeclareResult ? (reason) => onDeclareResult(row.id, month.month, reason) : undefined}
                      />
                    </td>
                  ))}

                  {/* Actions */}
                  <td className="px-2 py-2 text-center">
                    {canEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onSubmitMeasurement?.(row.id)}
                        disabled={!row.months.some(m => m.resultValue !== undefined)}
                      >
                        Submit
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="px-4 py-3 bg-muted/30 border-t flex flex-wrap items-center gap-4 text-xs">
          <span className="font-medium">Legend:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" />
            <span>Verified</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-50 border border-blue-200" />
            <span>Submitted</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
            <span>Rejected</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-50/30 border border-blue-100" />
            <span>FY{ fiscalYear + 1 } (Jan-Mar)</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Edit2 className="w-3 h-3" />
            <span>Click cell to edit</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ResultGridTable;
