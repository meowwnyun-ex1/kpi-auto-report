import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check, X, ChevronDown } from 'lucide-react';
import { Badge } from './badge';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showBadge?: boolean;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Select options',
  disabled = false,
  className,
  showBadge = true,
}: MultiSelectProps) {
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

  const toggleOption = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((v) => v !== value)
      : [...selected, value];
    onChange(newSelected);
  };

  const removeOption = (value: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((v) => v !== value));
  };

  const selectedOptions = options.filter((o) => selected.includes(o.value));

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm',
          'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
          disabled && 'opacity-50 cursor-not-allowed',
          isOpen && 'ring-2 ring-ring'
        )}>
        <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
          {selected.length === 0 ? (
            <span className="text-muted-foreground">{placeholder}</span>
          ) : showBadge ? (
            selectedOptions.slice(0, 3).map((opt) => (
              <Badge
                key={opt.value}
                variant="secondary"
                className="text-xs gap-1 pr-1 max-w-[120px]">
                <span className="truncate">{opt.label}</span>
                <button
                  type="button"
                  onClick={(e) => removeOption(opt.value, e)}
                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))
          ) : (
            <span>{selected.length} selected</span>
          )}
          {selected.length > 3 && showBadge && (
            <Badge variant="outline" className="text-xs">
              +{selected.length - 3} more
            </Badge>
          )}
        </div>
        <ChevronDown className={cn('h-4 w-4 opacity-50 transition-transform', isOpen && 'rotate-180')} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg max-h-60 overflow-auto">
          {options.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">No options available</div>
          ) : (
            <div className="p-1">
              {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleOption(option.value)}
                    className={cn(
                      'w-full flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left',
                      'hover:bg-accent hover:text-accent-foreground transition-colors',
                      isSelected && 'bg-accent/50'
                    )}>
                    {/* Circle indicator instead of checkmark */}
                    <div
                      className={cn(
                        'h-4 w-4 rounded-full border-2 flex-shrink-0 transition-colors',
                        isSelected
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 bg-transparent'
                      )}>
                      {isSelected && (
                        <div className="h-full w-full flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.label}</div>
                      {option.description && (
                        <div className="text-xs text-muted-foreground truncate">
                          {option.description}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
