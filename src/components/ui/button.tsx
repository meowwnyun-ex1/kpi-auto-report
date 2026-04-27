import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/shared/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        // Primary button - blue solid for main actions (Submit, Save, Retry)
        default: 'bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-sm hover:shadow-md',
        primary: 'bg-blue-500 hover:bg-blue-600 text-white font-semibold shadow-sm hover:shadow-md',

        // Secondary button - gray border for secondary actions (Cancel, Home, Back)
        secondary:
          'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium shadow-sm hover:shadow-md',

        // Outline - same as secondary
        outline:
          'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium shadow-sm hover:shadow-md',

        // Success button - green for positive actions
        success:
          'bg-green-500 hover:bg-green-600 text-white font-semibold shadow-sm hover:shadow-md',

        // Destructive button - red for dangerous actions
        destructive:
          'bg-red-500 hover:bg-red-600 text-white font-semibold shadow-sm hover:shadow-md',

        // Ghost button - transparent
        ghost:
          'bg-transparent text-gray-600 font-medium hover:text-gray-800 hover:bg-gray-100 transition-all duration-200 rounded-lg',

        // Link style
        link: 'text-blue-600 font-medium hover:text-blue-700 hover:underline transition-all duration-200 underline-offset-2',
      },
      size: {
        default: 'h-10 px-6 py-2.5 text-sm',
        sm: 'h-8 px-4 py-2 text-xs',
        lg: 'h-12 px-8 py-3 text-base',
        icon: 'h-10 w-10',
        xl: 'h-14 px-10 py-3.5 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
