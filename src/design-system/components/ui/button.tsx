/**
 * Enterprise Button Component
 * World-class professional button with multiple variants and states
 */

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

// ============================================
// BUTTON VARIANTS
// ============================================

const buttonVariants = cva(
  // Base styles - enterprise-grade foundation
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden group',
  {
    variants: {
      variant: {
        // Primary brand button - main action
        primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm hover:shadow-md active:shadow-sm',
        
        // Secondary button - alternative action
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border/50',
        
        // Outline button - subtle action
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        
        // Ghost button - minimal action
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        
        // Link button - text-only action
        link: 'text-primary underline-offset-4 hover:underline',
        
        // Destructive button - dangerous action
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm hover:shadow-md',
        
        // Success button - positive action
        success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md',
        
        // Warning button - caution action
        warning: 'bg-amber-600 text-white hover:bg-amber-700 shadow-sm hover:shadow-md',
        
        // Info button - informational action
        info: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md',
        
        // Gradient button - premium action
        gradient: 'bg-gradient-to-r from-primary to-primary/80 text-white hover:from-primary/90 hover:to-primary/70 shadow-md hover:shadow-lg',
      },
      size: {
        // Extra small - compact
        xs: 'h-7 rounded px-2 text-xs',
        
        // Small - compact
        sm: 'h-8 rounded-md px-3 text-xs',
        
        // Default - standard
        default: 'h-9 px-4 py-2',
        
        // Large - prominent
        lg: 'h-10 rounded-md px-6',
        
        // Extra large - very prominent
        xl: 'h-12 rounded-lg px-8 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
      loading: {
        true: 'pointer-events-none',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
      loading: false,
    },
  }
);

// ============================================
// BUTTON PROPS
// ============================================

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ripple?: boolean;
}

// ============================================
// BUTTON COMPONENT
// ============================================

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth, 
    loading = false,
    loadingText,
    leftIcon,
    rightIcon,
    ripple = true,
    children, 
    disabled,
    asChild = false,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : 'button';
    
    // Ripple effect
    const [ripples, setRipples] = React.useState<Array<{ id: number; x: number; y: number }>>([]);
    
    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple) return;
      
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      
      const newRipple = {
        id: Date.now(),
        x,
        y,
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
    };

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, fullWidth, loading }), className)}
        ref={ref}
        disabled={disabled || loading}
        onClick={createRipple}
        {...props}
      >
        {/* Ripple effects */}
        {ripple && (
          <span className="absolute inset-0 overflow-hidden rounded-md pointer-events-none">
            {ripples.map(ripple => (
              <span
                key={ripple.id}
                className="absolute bg-white/20 rounded-full animate-ping"
                style={{
                  left: ripple.x - 10,
                  top: ripple.y - 10,
                  width: 20,
                  height: 20,
                }}
              />
            ))}
          </span>
        )}
        
        {/* Loading spinner */}
        {loading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {/* Left icon */}
        {!loading && leftIcon && (
          <span className="shrink-0">{leftIcon}</span>
        )}
        
        {/* Button content */}
        <span className="truncate">
          {loading ? (loadingText || 'Loading...') : children}
        </span>
        
        {/* Right icon */}
        {!loading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);

Button.displayName = 'Button';

// ============================================
// SPECIALIZED BUTTON COMPONENTS
// ============================================

// Icon-only button
export const IconButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ButtonProps, 'children'> & { icon: React.ReactNode }
>(({ icon, className, size = 'sm', ...props }, ref) => (
  <Button
    ref={ref}
    className={cn('p-2', className)}
    size={size}
    {...props}
  >
    {icon}
  </Button>
));

IconButton.displayName = 'IconButton';

// Floating action button
export const FloatingActionButton = React.forwardRef<
  HTMLButtonElement,
  ButtonProps
>(({ className, children, size = 'lg', ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(
      'fixed bottom-6 right-6 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 z-50',
      className
    )}
    size={size}
    {...props}
  >
    {children}
  </Button>
));

FloatingActionButton.displayName = 'FloatingActionButton';

// Button group
export const ButtonGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: 'horizontal' | 'vertical';
    gap?: 'none' | 'sm' | 'md' | 'lg';
  }
>(({ 
  className, 
  orientation = 'horizontal', 
  gap = 'sm',
  children, 
  ...props 
}, ref) => {
  const gapClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
    md: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    lg: orientation === 'horizontal' ? 'space-x-3' : 'space-y-3',
  };

  return (
    <div
      ref={ref}
      className={cn(
        'flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

ButtonGroup.displayName = 'ButtonGroup';

export { Button, buttonVariants };
export type { ButtonProps };
