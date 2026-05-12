/**
 * Enhanced KPI Table with Approval Workflows
 * World-class KPI management table with approval actions
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from './button';
import { Badge } from './badge';
import { Card } from './card';

// ============================================
// TYPES
// ============================================

export interface KpiRecord {
  id: string | number;
  category: string;
  measurement: string;
  unit: string;
  targetValue?: number;
  resultValue?: number;
  achievementRate?: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  department?: string;
  fiscalYear?: number;
  month?: number;
  canEdit?: boolean;
  canApprove?: boolean;
  isBelowTarget?: boolean;
}

export interface KpiTableProps {
  data: KpiRecord[];
  type: 'yearly' | 'monthly' | 'result';
  loading?: boolean;
  currentUserRole?: 'admin' | 'manager' | 'user';
  onApprove?: (record: KpiRecord) => void;
  onReject?: (record: KpiRecord) => void;
  onEdit?: (record: KpiRecord) => void;
  onSubmitResult?: (record: KpiRecord) => void;
  onDeclareResult?: (record: KpiRecord, reason: string, files?: File[]) => void;
  onFillAllMonths?: (record: KpiRecord) => void;
  emptyText?: string;
}

// ============================================
// ACTION CELL COMPONENTS
// ============================================

interface ActionCellProps {
  record: KpiRecord;
  type: 'yearly' | 'monthly' | 'result';
  onApprove?: (record: KpiRecord) => void;
  onReject?: (record: KpiRecord) => void;
  onEdit?: (record: KpiRecord) => void;
  onSubmitResult?: (record: KpiRecord) => void;
  onDeclareResult?: (record: KpiRecord, reason: string, files?: File[]) => void;
  onFillAllMonths?: (record: KpiRecord) => void;
}

const ActionCell: React.FC<ActionCellProps> = ({
  record,
  type,
  onApprove,
  onReject,
  onEdit,
  onSubmitResult,
  onDeclareResult,
  onFillAllMonths,
}) => {
  const [showDeclareModal, setShowDeclareModal] = React.useState(false);
  const [declareReason, setDeclareReason] = React.useState('');
  const [declareFiles, setDeclareFiles] = React.useState<FileList | null>(null);

  const handleDeclareSubmit = () => {
    if (declareReason.trim()) {
      onDeclareResult?.(record, declareReason, declareFiles ? Array.from(declareFiles) : undefined);
      setShowDeclareModal(false);
      setDeclareReason('');
      setDeclareFiles(null);
    }
  };

  const renderYearlyActions = () => {
    if (record.status === 'approved') {
      return <Badge variant="success">Approved</Badge>;
    }

    return (
      <div className="flex gap-2">
        {record.canApprove && record.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={() => onApprove?.(record)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject?.(record)}
            >
              Reject
            </Button>
          </>
        )}
        {record.canEdit && record.status === 'draft' && (
          <Button size="sm" variant="outline" onClick={() => onEdit?.(record)}>
            Edit
          </Button>
        )}
        {record.status === 'pending' && !record.canApprove && (
          <Badge variant="warning">Pending Approval</Badge>
        )}
      </div>
    );
  };

  const renderMonthlyActions = () => {
    if (record.status === 'approved') {
      return (
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => onEdit?.(record)}>
            Edit Result
          </Button>
          <Badge variant="success">Approved</Badge>
        </div>
      );
    }

    return (
      <div className="flex gap-2">
        {record.canApprove && record.status === 'pending' && (
          <>
            <Button
              size="sm"
              variant="success"
              onClick={() => onApprove?.(record)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onReject?.(record)}
            >
              Reject
            </Button>
          </>
        )}
        {record.canEdit && record.status === 'draft' && (
          <Button size="sm" variant="outline" onClick={() => onEdit?.(record)}>
            Edit Target
          </Button>
        )}
        {record.status === 'pending' && !record.canApprove && (
          <Badge variant="warning">Pending Approval</Badge>
        )}
      </div>
    );
  };

  const renderResultActions = () => {
    return (
      <div className="flex gap-2">
        {record.canEdit && (
          <Button size="sm" variant="outline" onClick={() => onEdit?.(record)}>
            Edit
          </Button>
        )}
        
        {record.resultValue !== undefined && (
          <>
            <Button
              size="sm"
              variant="primary"
              onClick={() => onSubmitResult?.(record)}
            >
              Submit
            </Button>
            
            {record.isBelowTarget && (
              <Button
                size="sm"
                variant="warning"
                onClick={() => setShowDeclareModal(true)}
              >
                Declare
              </Button>
            )}
          </>
        )}
      </div>
    );
  };

  // Fill all months button for yearly targets
  if (type === 'yearly' && record.status === 'approved') {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onFillAllMonths?.(record)}
        >
          Fill All Months
        </Button>
        {renderYearlyActions()}
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-2">
        {type === 'yearly' && renderYearlyActions()}
        {type === 'monthly' && renderMonthlyActions()}
        {type === 'result' && renderResultActions()}
      </div>

      {/* Declare Modal */}
      {showDeclareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">Declare Result</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please explain why the target was not achieved and provide supporting evidence.
            </p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Explanation</label>
                <textarea
                  className="w-full p-2 border border-border rounded-md"
                  rows={4}
                  value={declareReason}
                  onChange={(e) => setDeclareReason(e.target.value)}
                  placeholder="Explain the reason for not meeting the target..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Attachments (Optional)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(e) => setDeclareFiles(e.target.files)}
                  className="w-full p-2 border border-border rounded-md"
                />
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowDeclareModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
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
// STATUS BADGE COMPONENT
// ============================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getVariant = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
        return 'destructive';
      case 'draft':
      default:
        return 'secondary';
    }
  };

  return <Badge variant={getVariant(status) as any}>{status}</Badge>;
};

// ============================================
// MAIN KPI TABLE COMPONENT
// ============================================

export const KpiTable: React.FC<KpiTableProps> = ({
  data,
  type,
  loading = false,
  currentUserRole = 'user',
  onApprove,
  onReject,
  onEdit,
  onSubmitResult,
  onDeclareResult,
  onFillAllMonths,
  emptyText = 'No data available',
}) => {
  const getColumns = () => {
    const baseColumns = [
      { key: 'category', title: 'Category', sortable: true },
      { key: 'measurement', title: 'Measurement', sortable: true },
      { key: 'unit', title: 'Unit' },
    ];

    if (type === 'yearly') {
      return [
        ...baseColumns,
        { key: 'targetValue', title: 'Target', numeric: true },
        { key: 'status', title: 'Status' },
        { key: 'action', title: 'Action' },
      ];
    }

    if (type === 'monthly') {
      return [
        ...baseColumns,
        { key: 'month', title: 'Month' },
        { key: 'targetValue', title: 'Target', numeric: true },
        { key: 'resultValue', title: 'Result', numeric: true },
        { key: 'achievementRate', title: 'Achievement %', numeric: true },
        { key: 'status', title: 'Status' },
        { key: 'action', title: 'Action' },
      ];
    }

    if (type === 'result') {
      return [
        ...baseColumns,
        { key: 'targetValue', title: 'Target', numeric: true },
        { key: 'resultValue', title: 'Result', numeric: true },
        { key: 'achievementRate', title: 'Achievement %', numeric: true },
        { key: 'status', title: 'Status' },
        { key: 'action', title: 'Action' },
      ];
    }

    return baseColumns;
  };

  const renderCell = (column: any, record: KpiRecord) => {
    switch (column.key) {
      case 'status':
        return <StatusBadge status={record.status} />;
      
      case 'achievementRate':
        return record.achievementRate ? `${record.achievementRate}%` : 'N/A';
      
      case 'action':
        return (
          <ActionCell
            record={record}
            type={type}
            onApprove={onApprove}
            onReject={onReject}
            onEdit={onEdit}
            onSubmitResult={onSubmitResult}
            onDeclareResult={onDeclareResult}
            onFillAllMonths={onFillAllMonths}
          />
        );
      
      default:
        return record[column.key as keyof KpiRecord];
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Card */}
      <Card>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-600">
                {data.filter(r => r.status === 'approved').length}
              </div>
              <div className="text-sm text-muted-foreground">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {data.filter(r => r.status === 'rejected').length}
              </div>
              <div className="text-sm text-muted-foreground">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-600">
                {data.filter(r => r.status === 'pending').length}
              </div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.length > 0 
                  ? Math.round((data.filter(r => r.status === 'approved').length / data.length) * 100)
                  : 0
                }%
              </div>
              <div className="text-sm text-muted-foreground">Fill Rate</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Main Table */}
      <div className="rounded-md border">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              {getColumns().map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'h-10 px-4 text-left align-middle font-medium text-muted-foreground',
                    column.numeric && 'text-right'
                  )}
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={getColumns().length}
                  className="text-center py-8 text-muted-foreground"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span>Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={getColumns().length}
                  className="text-center py-8 text-muted-foreground"
                >
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((record, index) => (
                <tr
                  key={record.id || index}
                  className={cn(
                    'border-b transition-colors hover:bg-muted/25',
                    record.status === 'rejected' && 'bg-red-50/50',
                    record.status === 'approved' && 'bg-emerald-50/50'
                  )}
                >
                  {getColumns().map((column) => (
                    <td
                      key={column.key}
                      className={cn(
                        'p-4 align-middle',
                        column.numeric && 'text-right font-mono'
                      )}
                    >
                      {renderCell(column, record)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
