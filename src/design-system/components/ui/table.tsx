/**
 * Enterprise Table Component
 * World-class professional table with advanced features
 */

import * as React from 'react';
import { cn } from '@/shared/lib/utils';

// ============================================
// TABLE CONTEXT
// ============================================

const TableContext = React.createContext<{
  variant: 'default' | 'bordered' | 'striped' | 'compact';
  interactive: boolean;
}>({
  variant: 'default',
  interactive: false,
});

// ============================================
// TABLE COMPONENTS
// ============================================

interface TableProps extends React.HTMLAttributes<HTMLTableElement> {
  variant?: 'default' | 'bordered' | 'striped' | 'compact';
  interactive?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant = 'default', interactive = false, ...props }, ref) => {
    const contextValue = React.useMemo(() => ({
      variant,
      interactive,
    }), [variant, interactive]);

    return (
      <TableContext.Provider value={contextValue}>
        <div className="relative w-full overflow-auto">
          <table
            ref={ref}
            className={cn(
              'w-full caption-bottom text-sm',
              variant === 'bordered' && 'border border-border',
              className
            )}
            {...props}
          />
        </div>
      </TableContext.Provider>
    );
  }
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody
    ref={ref}
    className={cn('[&_tr:last-child]:border-0', className)}
    {...props}
  />
));
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
      className
    )}
    {...props}
  />
));
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & {
    selected?: boolean;
    onClick?: () => void;
  }
>(({ className, selected = false, onClick, ...props }, ref) => {
  const { variant, interactive } = React.useContext(TableContext);
  
  return (
    <tr
      ref={ref}
      className={cn(
        'border-b transition-colors',
        variant === 'striped' && 'even:bg-muted/25',
        variant === 'compact' && 'border-0',
        interactive && 'hover:bg-muted/50 cursor-pointer',
        selected && 'bg-primary/5 hover:bg-primary/10',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      {...props}
    />
  );
});
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement> & {
    sortable?: boolean;
    sortDirection?: 'asc' | 'desc' | null;
    onSort?: () => void;
  }
>(({ 
  className, 
  sortable = false, 
  sortDirection = null, 
  onSort,
  children,
  ...props 
}, ref) => {
  const { variant } = React.useContext(TableContext);
  
  return (
    <th
      ref={ref}
      className={cn(
        'h-10 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
        variant === 'compact' && 'h-8 px-2',
        sortable && 'cursor-pointer hover:text-foreground hover:bg-muted/25 transition-colors',
        className
      )}
      onClick={sortable ? onSort : undefined}
      {...props}
    >
      <div className="flex items-center gap-2">
        {children}
        {sortable && (
          <div className="flex flex-col">
            <svg
              className={cn(
                'w-3 h-3 -mb-1 transition-colors',
                sortDirection === 'asc' ? 'text-foreground' : 'text-muted-foreground/40'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
            <svg
              className={cn(
                'w-3 h-3 transition-colors',
                sortDirection === 'desc' ? 'text-foreground' : 'text-muted-foreground/40'
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        )}
      </div>
    </th>
  );
});
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement> & {
    highlight?: boolean;
    numeric?: boolean;
  }
>(({ className, highlight = false, numeric = false, ...props }, ref) => {
  const { variant } = React.useContext(TableContext);
  
  return (
    <td
      ref={ref}
      className={cn(
        'p-4 align-middle [&:has([role=checkbox])]:pr-0',
        variant === 'compact' && 'p-2',
        highlight && 'bg-primary/5 font-medium',
        numeric && 'text-right font-mono tabular-nums',
        className
      )}
      {...props}
    />
  );
});
TableCell.displayName = 'TableCell';

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption
    ref={ref}
    className={cn('mt-4 text-sm text-muted-foreground', className)}
    {...props}
  />
));
TableCaption.displayName = 'TableCaption';

// ============================================
// SPECIALIZED TABLE COMPONENTS
// ============================================

// KPI Data Table
interface KPITableProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'children'> {
  data: Array<Record<string, any>>;
  columns: Array<{
    key: string;
    title: string;
    sortable?: boolean;
    numeric?: boolean;
    render?: (value: any, record: any, index: number) => React.ReactNode;
    width?: string;
  }>;
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
  selection?: {
    selectedRowKeys: string[];
    onChange: (selectedRowKeys: string[]) => void;
  };
  onRowClick?: (record: any, index: number) => void;
  emptyText?: string;
}

const KPITable = React.forwardRef<HTMLDivElement, KPITableProps>(
  ({
    data,
    columns,
    loading = false,
    pagination,
    selection,
    onRowClick,
    emptyText = 'No data available',
    className,
    ...props
  }, ref) => {
    const [sortConfig, setSortConfig] = React.useState<{
      key: string;
      direction: 'asc' | 'desc';
    } | null>(null);

    const handleSort = (key: string) => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    };

    const sortedData = React.useMemo(() => {
      if (!sortConfig) return data;

      return [...data].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        const aStr = String(aValue);
        const bStr = String(bValue);
        return sortConfig.direction === 'asc' 
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }, [data, sortConfig]);

    const handleRowSelect = (record: any, selected: boolean) => {
      if (!selection) return;
      
      const rowKey = record.id || record.key;
      if (selected) {
        selection.onChange([...selection.selectedRowKeys, rowKey]);
      } else {
        selection.onChange(selection.selectedRowKeys.filter(key => key !== rowKey));
      }
    };

    const handleSelectAll = (selected: boolean) => {
      if (!selection) return;
      
      if (selected) {
        const allKeys = sortedData.map(record => record.id || record.key);
        selection.onChange(allKeys);
      } else {
        selection.onChange([]);
      }
    };

    const isAllSelected = selection ? sortedData.length > 0 && selection.selectedRowKeys.length === sortedData.length : false;
    const isIndeterminate = selection ? selection.selectedRowKeys.length > 0 && selection.selectedRowKeys.length < sortedData.length : false;

    return (
      <div ref={ref} className={cn('space-y-4', className)} {...props}>
        <div className="rounded-md border">
          <Table interactive={!!onRowClick}>
            <TableHeader>
              <TableRow>
                {selection && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                )}
                {columns.map((column) => (
                  <TableHead
                    key={column.key}
                    sortable={column.sortable}
                    sortDirection={sortConfig?.key === column.key ? sortConfig.direction : null}
                    onSort={() => column.sortable && handleSort(column.key)}
                    style={{ width: column.width }}
                  >
                    {column.title}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (selection ? 1 : 0)} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      <span>Loading...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sortedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + (selection ? 1 : 0)} className="text-center py-8 text-muted-foreground">
                    {emptyText}
                  </TableCell>
                </TableRow>
              ) : (
                sortedData.map((record, index) => {
                  const isSelected = selection ? selection.selectedRowKeys.includes(record.id || record.key) : false;
                  return (
                    <TableRow
                      key={record.id || record.key || index}
                      selected={isSelected}
                      onClick={() => onRowClick?.(record, index)}
                    >
                      {selection && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleRowSelect(record, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                      )}
                      {columns.map((column) => (
                        <TableCell
                          key={column.key}
                          numeric={column.numeric}
                        >
                          {column.render 
                            ? column.render(record[column.key], record, index)
                            : record[column.key]
                          }
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((pagination.current - 1) * pagination.pageSize) + 1} to{' '}
              {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
              {pagination.total} entries
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => pagination.onChange(pagination.current - 1)}
                disabled={pagination.current <= 1}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
              </span>
              <button
                onClick={() => pagination.onChange(pagination.current + 1)}
                disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
                className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
);

KPITable.displayName = 'KPITable';

// Status table cell
interface StatusTableCellProps {
  status: 'online' | 'offline' | 'pending' | 'approved' | 'rejected' | 'draft';
  label?: string;
}

const StatusTableCell = React.forwardRef<HTMLDivElement, StatusTableCellProps>(
  ({ status, label, ...props }, ref) => {
    const statusConfig = {
      online: { variant: 'success' as const, icon: '🟢', label: 'Online' },
      offline: { variant: 'secondary' as const, icon: '⚫', label: 'Offline' },
      pending: { variant: 'warning' as const, icon: '⏳', label: 'Pending' },
      approved: { variant: 'success' as const, icon: '✅', label: 'Approved' },
      rejected: { variant: 'destructive' as const, icon: '❌', label: 'Rejected' },
      draft: { variant: 'secondary' as const, icon: '📝', label: 'Draft' },
    };

    const config = statusConfig[status];

    return (
      <div ref={ref} className="flex items-center gap-2" {...props}>
        <span className="text-sm">{config.icon}</span>
        <span className="text-sm">{label || config.label}</span>
      </div>
    );
  }
);

StatusTableCell.displayName = 'StatusTableCell';

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
  KPITable,
  StatusTableCell,
};
