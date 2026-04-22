import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ColumnWidths {
  [key: string]: number;
}

interface ResizableTableProps {
  children: React.ReactNode;
  storageKey?: string;
  defaultWidths?: ColumnWidths;
  className?: string;
}

export function ResizableTableHead({
  children,
  columnKey,
  width,
  onResize,
  className = '',
}: {
  children: React.ReactNode;
  columnKey: string;
  width: number;
  onResize: (key: string, width: number) => void;
  className?: string;
}) {
  const startX = useRef(0);
  const startWidth = useRef(0);
  const isResizing = useRef(false);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      startX.current = e.clientX;
      startWidth.current = width;
      isResizing.current = true;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        if (!isResizing.current) return;
        const diff = moveEvent.clientX - startX.current;
        const newWidth = Math.max(40, Math.min(500, startWidth.current + diff));
        onResize(columnKey, newWidth);
      };

      const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [width, columnKey, onResize]
  );

  return (
    <TableHead
      className={`relative select-none ${className}`}
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}>
      {children}
      <div
        className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-400 active:bg-blue-600 transition-colors"
        onMouseDown={handleMouseDown}
      />
    </TableHead>
  );
}

export function ResizableTableCell({
  children,
  width,
  className = '',
}: {
  children: React.ReactNode;
  width: number;
  className?: string;
}) {
  return (
    <TableCell
      className={className}
      style={{ width: `${width}px`, minWidth: `${width}px`, maxWidth: `${width}px` }}>
      {children}
    </TableCell>
  );
}

export function ResizableTable({
  children,
  storageKey,
  defaultWidths = {},
  className = '',
}: ResizableTableProps) {
  const [columnWidths, setColumnWidths] = useState<ColumnWidths>(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`table-widths-${storageKey}`);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultWidths;
        }
      }
    }
    return defaultWidths;
  });

  const handleResize = useCallback(
    (key: string, width: number) => {
      setColumnWidths((prev) => {
        const newWidths = { ...prev, [key]: width };
        if (storageKey) {
          localStorage.setItem(`table-widths-${storageKey}`, JSON.stringify(newWidths));
        }
        return newWidths;
      });
    },
    [storageKey]
  );

  return (
    <div className={`overflow-x-auto ${className}`}>
      <Table className="text-xs">
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            if (child.type === TableHeader || child.type === TableBody) {
              return React.cloneElement(child as React.ReactElement<any>, {
                children: React.Children.map((child as any).props.children, (row: any) => {
                  if (React.isValidElement(row)) {
                    const rowEl = row as React.ReactElement<any>;
                    if (rowEl.type === TableRow) {
                      return React.cloneElement(rowEl, {
                        children: React.Children.map(rowEl.props.children, (cell: any) => {
                          if (React.isValidElement(cell)) {
                            const cellEl = cell as React.ReactElement<any>;
                            if (
                              cellEl.type === ResizableTableHead ||
                              cellEl.type === ResizableTableCell
                            ) {
                              const key = cellEl.props.columnKey || '';
                              const width = columnWidths[key] || cellEl.props.width || 100;
                              return React.cloneElement(cellEl, {
                                width,
                                onResize: handleResize,
                              });
                            }
                          }
                          return cell;
                        }),
                      });
                    }
                  }
                  return row;
                }),
              });
            }
          }
          return child;
        })}
      </Table>
    </div>
  );
}

export function useColumnWidths(storageKey: string, defaultWidths: ColumnWidths) {
  const [widths, setWidths] = useState<ColumnWidths>(() => {
    const saved = localStorage.getItem(`table-widths-${storageKey}`);
    if (saved) {
      try {
        return { ...defaultWidths, ...JSON.parse(saved) };
      } catch {
        return defaultWidths;
      }
    }
    return defaultWidths;
  });

  const setWidth = useCallback(
    (key: string, width: number) => {
      setWidths((prev) => {
        const newWidths = { ...prev, [key]: width };
        localStorage.setItem(`table-widths-${storageKey}`, JSON.stringify(newWidths));
        return newWidths;
      });
    },
    [storageKey]
  );

  return { widths, setWidth, setWidths };
}
