import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';
import { Pagination } from './Pagination';
import { COLORS, TABLE_COLORS } from '@/shared/constants/colors';
import { PRIORITY_COLORS, getPriorityClasses } from '@/shared/constants/priority-colors';

// ============================================
// THEME CONFIG
// ============================================

export type TableTheme = 'blue' | 'emerald' | 'gray' | 'purple' | 'red' | 'orange';

const THEME_CONFIG: Record<
  TableTheme,
  {
    headerBg: string;
    headerGradient: string;
    headerCellBg: string;
    rowHover: string;
    rowNumberBg: string;
    dotColor: string;
    iconColor: string;
    priority: 'medium' | 'low' | 'neutral' | 'high' | 'critical';
  }
> = {
  blue: {
    headerBg: TABLE_COLORS.header.blue,
    headerGradient: TABLE_COLORS.header.blue,
    headerCellBg: TABLE_COLORS.cell.header,
    rowHover: TABLE_COLORS.hover.blue,
    rowNumberBg: TABLE_COLORS.cell.rowNumber,
    dotColor: COLORS.primary[400],
    iconColor: COLORS.primary[600],
    priority: 'medium',
  },
  emerald: {
    headerBg: TABLE_COLORS.header.emerald,
    headerGradient: TABLE_COLORS.header.emerald,
    headerCellBg: TABLE_COLORS.cell.header,
    rowHover: TABLE_COLORS.hover.emerald,
    rowNumberBg: TABLE_COLORS.cell.rowNumber,
    dotColor: COLORS.success[400],
    iconColor: COLORS.success[600],
    priority: 'low',
  },
  gray: {
    headerBg: TABLE_COLORS.header.gray,
    headerGradient: TABLE_COLORS.header.gray,
    headerCellBg: TABLE_COLORS.cell.header,
    rowHover: TABLE_COLORS.hover.gray,
    rowNumberBg: TABLE_COLORS.cell.rowNumber,
    dotColor: COLORS.gray[400],
    iconColor: COLORS.gray[600],
    priority: 'neutral',
  },
  purple: {
    headerBg: 'bg-gradient-to-r from-purple-50 to-violet-50',
    headerGradient: 'bg-gradient-to-r from-purple-50 to-violet-100',
    headerCellBg: TABLE_COLORS.cell.header,
    rowHover: 'hover:bg-purple-50/30',
    rowNumberBg: TABLE_COLORS.cell.rowNumber,
    dotColor: '#a78bfa',
    iconColor: '#9333ea',
    priority: 'high',
  },
  red: {
    headerBg: 'bg-gradient-to-r from-red-50 to-rose-50',
    headerGradient: 'bg-gradient-to-r from-red-50 to-rose-100',
    headerCellBg: TABLE_COLORS.cell.header,
    rowHover: 'hover:bg-red-50/30',
    rowNumberBg: TABLE_COLORS.cell.rowNumber,
    dotColor: COLORS.error[400],
    iconColor: COLORS.error[600],
    priority: 'critical',
  },
  orange: {
    headerBg: 'bg-gradient-to-r from-orange-50 to-amber-50',
    headerGradient: 'bg-gradient-to-r from-orange-50 to-amber-100',
    headerCellBg: TABLE_COLORS.cell.header,
    rowHover: 'hover:bg-orange-50/30',
    rowNumberBg: TABLE_COLORS.cell.rowNumber,
    dotColor: COLORS.warning[400],
    iconColor: COLORS.warning[600],
    priority: 'high',
  },
};

export function getTableTheme(theme: TableTheme) {
  return THEME_CONFIG[theme];
}

// ============================================
// LEGEND ITEM
// ============================================

export interface LegendItem {
  color: string;
  label: string;
}

// ============================================
// TABLE CONTAINER
// ============================================

interface TableContainerProps {
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  title: string;
  subtitle?: string;
  badge?: string | number;
  totalCount?: number;
  countUnit?: string;

  legendItems?: LegendItem[];

  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  searchActions?: React.ReactNode;

  actions?: React.ReactNode;

  theme?: TableTheme;

  children?: React.ReactNode;

  loading?: boolean;
  loadingRows?: number;

  empty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ComponentType<{ className?: string }>;

  // Pagination props
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    itemsPerPageOptions?: number[];
  };
}

export function TableContainer({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  badge,
  totalCount,
  countUnit,
  legendItems,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  searchActions,
  actions,
  theme = 'gray',
  children,
  loading,
  loadingRows = 5,
  empty,
  emptyTitle = 'No data found',
  emptyDescription = '',
  emptyIcon: EmptyIcon,
  pagination,
}: TableContainerProps) {
  const cfg = THEME_CONFIG[theme];
  const resolvedIconColor = iconColor || cfg.iconColor;

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8 space-y-3">
        {Array.from({ length: loadingRows }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Empty state
  if (empty) {
    const FallbackIcon = EmptyIcon || Icon;
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 bg-white rounded-xl border border-gray-200">
        <div
          className={`w-16 h-16 rounded-2xl ${cfg.headerCellBg} flex items-center justify-center`}>
          <FallbackIcon className={`w-8 h-8 ${resolvedIconColor} opacity-40`} />
        </div>
        <div className="text-center">
          <p className="font-semibold text-gray-500">{emptyTitle}</p>
          {emptyDescription && <p className="text-sm text-gray-400 mt-1">{emptyDescription}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header bar */}
      <div className={`p-4 ${cfg.headerBg} border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm">
              <Icon className={`w-4 h-4 ${resolvedIconColor}`} />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-gray-900">{title}</h3>
              {totalCount !== undefined && (
                <span className="text-xs font-mono text-gray-500 bg-white/60 px-2 py-1 rounded">
                  {totalCount.toLocaleString()}{' '}
                  {countUnit
                    ? totalCount === 1
                      ? countUnit.charAt(0).toUpperCase() + countUnit.slice(1)
                      : countUnit.charAt(0).toUpperCase() + countUnit.slice(1) + 's'
                    : ''}
                </span>
              )}
            </div>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-4">
            {badge !== undefined && (
              <div className="text-xs font-mono text-gray-500 bg-white/60 px-2 py-1 rounded">
                {badge}
              </div>
            )}
            {actions}
          </div>
        </div>
      </div>

      {/* Search bar (optional) */}
      {onSearchChange && (
        <div className="px-4 py-3 border-b border-gray-100">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10 h-9"
              />
            </div>
            {searchActions}
          </div>
        </div>
      )}

      {/* Table content */}
      {children}

      {/* Pagination */}
      {pagination && !loading && !empty && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={pagination.onPageChange}
          onItemsPerPageChange={pagination.onItemsPerPageChange}
          itemsPerPageOptions={pagination.itemsPerPageOptions}
        />
      )}
    </div>
  );
}

// ============================================
// CONVENIENT STYLE CONSTANTS
// ============================================

export const TABLE_STYLES = {
  /** Sticky header row classes */
  headerRow: TABLE_COLORS.border.header,
  /** Standard header cell classes */
  headerCell: `text-xs font-bold ${TABLE_COLORS.text.header} py-2`,
  /** Row number cell */
  rowNumber: `text-center text-xs font-mono text-gray-400 font-bold pl-6 py-2 ${TABLE_COLORS.cell.rowNumber}`,
  /** Measurement/content cell */
  measurementCell: `py-2 ${TABLE_COLORS.cell.data}`,
  /** Numeric cell (neutral) */
  numericCell: `text-right py-2 ${TABLE_COLORS.cell.alternate}`,
  /** Standard data row */
  dataRow: `${TABLE_COLORS.border.default} transition-colors group`,
  /** Action cell */
  actionCell: 'text-center pr-6 py-2',
} as const;
