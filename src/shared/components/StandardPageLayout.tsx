import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RefreshCw, ChevronLeft, Building2, Calendar } from 'lucide-react';
import { DepartmentSelector } from '@/components/kpi/DepartmentSelector';

const EMPTY_YEARS: number[] = [];

interface StandardPageLayoutProps {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  badge?: string | number;
  children: React.ReactNode;
  rightActions?: React.ReactNode;
  department?: string;
  fiscalYear?: number;
  availableYears?: number[];
  onDepartmentChange?: (value: string) => void;
  onFiscalYearChange?: (value: number) => void;
  onRefresh?: () => void;
  loading?: boolean;
  theme?: 'blue' | 'emerald' | 'gray' | 'purple';
}

export function StandardPageLayout({
  title,
  icon: Icon,
  iconColor = 'text-blue-600',
  showBackButton = false,
  onBackClick,
  badge,
  children,
  rightActions,
  department,
  fiscalYear,
  availableYears = EMPTY_YEARS,
  onDepartmentChange,
  onFiscalYearChange,
  onRefresh,
  loading = false,
  theme = 'blue',
}: StandardPageLayoutProps) {
  const [dynamicYears, setDynamicYears] = useState<number[]>([]);
  const hasSetDefaultYear = useRef(false);

  // Generate available years: current year + 3 previous years if not provided
  useEffect(() => {
    if (availableYears.length > 0) {
      setDynamicYears(availableYears);
    } else {
      const currentYear = new Date().getFullYear();
      const years = [];

      // Add current year and 3 previous years
      for (let i = 0; i <= 3; i++) {
        years.push(currentYear - i);
      }

      setDynamicYears(years);

      // Set default to current year if not selected and callback provided
      if (!fiscalYear && onFiscalYearChange && !hasSetDefaultYear.current) {
        hasSetDefaultYear.current = true;
        onFiscalYearChange(currentYear);
      }
    }
  }, [availableYears]); // Remove fiscalYear and onFiscalYearChange from dependencies

  const themeColors = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-600',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-600',
      badgeBorder: 'border-blue-200',
    },
    emerald: {
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-50',
      iconColor: 'text-emerald-600',
      badgeBg: 'bg-emerald-50',
      badgeText: 'text-emerald-600',
      badgeBorder: 'border-emerald-200',
    },
    gray: {
      bg: 'bg-gray-50',
      iconBg: 'bg-gray-50',
      iconColor: 'text-gray-600',
      badgeBg: 'bg-gray-50',
      badgeText: 'text-gray-600',
      badgeBorder: 'border-gray-200',
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-50',
      iconColor: 'text-purple-600',
      badgeBg: 'bg-purple-50',
      badgeText: 'text-purple-600',
      badgeBorder: 'border-purple-200',
    },
  };

  const colors = themeColors[theme];

  return (
    <div className="flex flex-col h-full bg-gray-50/60">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
        <div className="px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={onBackClick}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors mr-1">
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back</span>
              </button>
            )}
            <div>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-50">
                  <Icon className={`w-3.5 h-3.5 ${iconColor}`} />
                </div>
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
                {badge && (
                  <Badge
                    className={`text-xs font-mono ${colors.badgeBg} ${colors.badgeText} ${colors.badgeBorder}`}>
                    {badge}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Department Selector */}
            {department && onDepartmentChange && (
              <DepartmentSelector
                value={department}
                onChange={onDepartmentChange}
                label=""
                showKpiOnly={true}
                restrictToUserDept={false}
              />
            )}

            {/* Fiscal Year Selector */}
            {fiscalYear && onFiscalYearChange && (
              <Select
                value={String(fiscalYear)}
                onValueChange={(v) => onFiscalYearChange(parseInt(v))}>
                <SelectTrigger className="w-[120px] h-8 bg-gray-50 text-xs border-gray-200">
                  <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                  <SelectValue placeholder="Fiscal Year" />
                </SelectTrigger>
                <SelectContent>
                  {dynamicYears.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      FY{y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Additional Right Actions */}
            {rightActions}

            {/* Refresh Button - Always Last */}
            {onRefresh && (
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8 border-gray-200"
                onClick={onRefresh}>
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-auto p-6">{children}</div>
    </div>
  );
}
