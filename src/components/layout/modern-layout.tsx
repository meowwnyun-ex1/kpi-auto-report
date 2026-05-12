/**
 * MODERN LAYOUT - Re-exports original shell components
 * AppSidebar is beautiful and already functional
 */

import React, { useState, useEffect, useRef } from 'react';

// Re-export original shell components
export { AppSidebar, NavUser } from './shell';
export { AppHeader } from './shell/header/AppHeader';
export { ShellLayout } from './shell/layouts/ShellLayout';
export type { ShellLayoutProps, LayoutVariant } from './shell/layouts/ShellLayout';

// For backward compatibility, also export as Modern aliases
export { AppSidebar as ModernSidebar } from './shell';
export { AppHeader as ModernHeader } from './shell/header/AppHeader';
export { ShellLayout as ModernShellLayout } from './shell/layouts/ShellLayout';

// Page layout with icon + FY dropdown support
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const EMPTY_YEARS: number[] = [];

interface ModernPageLayoutProps {
  children: React.ReactNode;
  title?: string;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColor?: string;
  fiscalYear?: number;
  availableYears?: number[];
  onFiscalYearChange?: (year: number) => void;
  rightActions?: React.ReactNode;
}

export const ModernPageLayout: React.FC<ModernPageLayoutProps> = ({
  children,
  title,
  className,
  icon: Icon,
  iconColor = 'text-blue-600',
  fiscalYear,
  availableYears = EMPTY_YEARS,
  onFiscalYearChange,
  rightActions,
}) => {
  const [dynamicYears, setDynamicYears] = useState<number[]>([]);
  const hasSetDefaultYear = useRef(false);

  useEffect(() => {
    setDynamicYears(availableYears);
  }, [availableYears]);

  useEffect(() => {
    if (
      !fiscalYear &&
      onFiscalYearChange &&
      dynamicYears.length > 0 &&
      !hasSetDefaultYear.current
    ) {
      hasSetDefaultYear.current = true;
      onFiscalYearChange(dynamicYears[0]);
    }
  }, [dynamicYears, fiscalYear, onFiscalYearChange]);

  return (
    <div className={cn('min-h-screen bg-gray-50/50 flex flex-col', className)}>
      {title && (
        <div className="bg-white border-b border-gray-100 shadow-sm flex-shrink-0">
          <div className="max-w-[1440px] mx-auto px-4 lg:px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              {Icon && (
                <div
                  className={cn(
                    'inline-flex items-center justify-center w-7 h-7 rounded-md bg-gray-50'
                  )}>
                  <Icon className={cn('w-4 h-4', iconColor)} />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {onFiscalYearChange && (
                <Select
                  value={fiscalYear ? String(fiscalYear) : ''}
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

              {rightActions}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 lg:px-6 py-6">{children}</main>
    </div>
  );
};
