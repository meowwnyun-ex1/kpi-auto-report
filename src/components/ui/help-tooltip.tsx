import * as React from 'react';
import { HelpCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

interface HelpTooltipProps {
  content: React.ReactNode;
  title?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Clickable help icon that shows a tooltip panel
 * Better for mobile and saves screen space compared to always-visible text
 */
export function HelpTooltip({ content, title, className, iconClassName }: HelpTooltipProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'text-muted-foreground hover:text-foreground transition-colors rounded-full p-0.5',
          'hover:bg-muted/50',
          isOpen && 'text-blue-600 bg-blue-50',
          iconClassName
        )}>
        <HelpCircle className="h-4 w-4" />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 top-full left-0 mt-2 p-4 rounded-lg',
            'bg-white border shadow-lg min-w-[280px] max-w-[360px]',
            'animate-in fade-in-0 zoom-in-95 duration-200'
          )}>
          {title && (
            <div className="flex items-center justify-between mb-2 pb-2 border-b">
              <h4 className="font-semibold text-sm">{title}</h4>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsOpen(false)}>
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <div className="text-sm text-muted-foreground space-y-2">{content}</div>
        </div>
      )}
    </div>
  );
}

// Preset help content for common use cases
export const HelpContent = {
  calculationRules: (
    <div className="space-y-2">
      <p className="font-medium text-foreground">Calculation Rules:</p>
      <ul className="list-disc list-inside space-y-1 text-xs">
        <li>Percentage targets at 100%: Each month = 100%</li>
        <li>Other targets: Monthly = Dept Target / 12</li>
        <li>Click "Auto Fill" to apply calculated values</li>
      </ul>
      <p className="font-medium text-foreground mt-3">Accumulated Tracking:</p>
      <ul className="list-disc list-inside space-y-1 text-xs">
        <li>Remaining shows how much target is left</li>
        <li>Exhausted means target is used up - input disabled</li>
        <li>Cannot enter values exceeding remaining target</li>
      </ul>
    </div>
  ),

  yearlyTarget: (
    <div className="space-y-2">
      <p className="font-medium text-foreground">Yearly Target Setting:</p>
      <ul className="list-disc list-inside space-y-1 text-xs">
        <li>Total Target: Shared across all related departments</li>
        <li>Dept Target: Your department's portion</li>
        <li>Auto-calculates monthly targets based on yearly values</li>
      </ul>
    </div>
  ),

  departmentAccess: (
    <div className="space-y-2">
      <p className="text-xs">
        Select departments this user can manage. They will have edit access to KPI data for these
        departments.
      </p>
    </div>
  ),

  relatedDepartments: (
    <div className="space-y-2">
      <p className="text-xs">
        Other departments that share this KPI. They will receive the same target values and can view
        the results.
      </p>
    </div>
  ),
};
