import * as React from 'react';
import { cn } from '@/shared/utils';

interface NumberInputProps extends Omit<React.ComponentProps<'input'>, 'type' | 'value' | 'onChange'> {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  placeholder?: string;
  step?: string;
  min?: number;
  max?: number;
  className?: string;
  disabled?: boolean;
}

/**
 * Number input component that:
 * - Shows placeholder when empty
 * - Clears placeholder on focus
 * - Allows empty value (null) instead of showing 0
 * - Handles decimal numbers properly
 */
export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      onChange,
      placeholder = '0',
      step = '0.01',
      min,
      max,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const [displayValue, setDisplayValue] = React.useState<string>(
      value !== null && value !== undefined ? String(value) : ''
    );
    const [isFocused, setIsFocused] = React.useState(false);

    // Sync display value with prop value
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(value !== null && value !== undefined ? String(value) : '');
      }
    }, [value, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Clear display when focused if value is empty
      if (value === null || value === undefined) {
        setDisplayValue('');
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      const inputValue = e.target.value.trim();

      if (inputValue === '' || isNaN(parseFloat(inputValue))) {
        // Empty or invalid - set to null
        setDisplayValue('');
        onChange(null);
      } else {
        // Valid number - update
        const numValue = parseFloat(inputValue);
        setDisplayValue(String(numValue));
        onChange(numValue);
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Allow empty string, numbers, decimal point, and minus sign
      if (inputValue === '' || /^-?\d*\.?\d*$/.test(inputValue)) {
        setDisplayValue(inputValue);
      }
    };

    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        step={step}
        min={min}
        max={max}
        value={displayValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={isFocused ? '' : placeholder}
        className={cn(
          'flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm transition-colors',
          'placeholder:text-muted-foreground/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'text-right', // Right-align numbers
          className
        )}
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';
