import React from 'react';
import { Input } from '@/components/ui/input';
import { Search, Loader2 } from 'lucide-react';

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
  }
> = {
  blue: {
    headerBg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
    headerGradient: 'bg-gradient-to-r from-blue-50 to-indigo-100',
    headerCellBg: 'bg-blue-50',
    rowHover: 'hover:bg-blue-50/30',
    rowNumberBg: 'bg-blue-50/50',
    dotColor: 'bg-blue-400',
    iconColor: 'text-blue-600',
  },
  emerald: {
    headerBg: 'bg-gradient-to-r from-emerald-50 to-green-50',
    headerGradient: 'bg-gradient-to-r from-emerald-50 to-green-100',
    headerCellBg: 'bg-emerald-50',
    rowHover: 'hover:bg-emerald-50/30',
    rowNumberBg: 'bg-emerald-50/50',
    dotColor: 'bg-emerald-400',
    iconColor: 'text-emerald-600',
  },
  gray: {
    headerBg: 'bg-gradient-to-r from-gray-50 to-slate-50',
    headerGradient: 'bg-gradient-to-r from-gray-50 to-gray-100',
    headerCellBg: 'bg-gray-50',
    rowHover: 'hover:bg-gray-50/30',
    rowNumberBg: 'bg-gray-50/50',
    dotColor: 'bg-gray-400',
    iconColor: 'text-gray-600',
  },
  purple: {
    headerBg: 'bg-gradient-to-r from-purple-50 to-violet-50',
    headerGradient: 'bg-gradient-to-r from-purple-50 to-violet-100',
    headerCellBg: 'bg-purple-50',
    rowHover: 'hover:bg-purple-50/30',
    rowNumberBg: 'bg-purple-50/50',
    dotColor: 'bg-purple-400',
    iconColor: 'text-purple-600',
  },
  red: {
    headerBg: 'bg-gradient-to-r from-red-50 to-rose-50',
    headerGradient: 'bg-gradient-to-r from-red-50 to-rose-100',
    headerCellBg: 'bg-red-50',
    rowHover: 'hover:bg-red-50/30',
    rowNumberBg: 'bg-red-50/50',
    dotColor: 'bg-red-400',
    iconColor: 'text-red-600',
  },
  orange: {
    headerBg: 'bg-gradient-to-r from-orange-50 to-amber-50',
    headerGradient: 'bg-gradient-to-r from-orange-50 to-amber-100',
    headerCellBg: 'bg-orange-50',
    rowHover: 'hover:bg-orange-50/30',
    rowNumberBg: 'bg-orange-50/50',
    dotColor: 'bg-orange-400',
    iconColor: 'text-orange-600',
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
}

export function TableContainer({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  badge,
  totalCount,
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
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-gray-900">{title}</h3>
                {badge !== undefined && (
                  <span className="text-xs font-mono text-gray-500 bg-white/60 px-1.5 py-0.5 rounded">
                    {badge}
                  </span>
                )}
              </div>
              {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {totalCount !== undefined && (
              <div className="text-xs font-mono text-gray-500 bg-white/60 px-2 py-1 rounded">
                Total: {totalCount.toLocaleString()}
              </div>
            )}
            {legendItems && legendItems.length > 0 && (
              <div className="flex items-center gap-4 text-xs text-gray-600">
                {legendItems.map((item) => (
                  <div key={item.label} className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span>{item.label}</span>
                  </div>
                ))}
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
    </div>
  );
}

// ============================================
// CONVENIENT STYLE CONSTANTS
// ============================================

export const TABLE_STYLES = {
  /** Sticky header row classes */
  headerRow: 'border-b border-gray-300',
  /** Standard header cell classes */
  headerCell: 'text-xs font-bold text-gray-700 py-4',
  /** Row number cell */
  rowNumber: 'text-center text-xs font-mono text-gray-400 font-bold pl-6 py-4',
  /** Measurement/content cell */
  measurementCell: 'py-4 bg-white',
  /** Numeric cell (neutral) */
  numericCell: 'text-right py-4 bg-gray-50/30',
  /** Standard data row */
  dataRow: 'border-b border-gray-100 transition-colors group',
  /** Action cell */
  actionCell: 'text-center pr-6 py-4',
} as const;
