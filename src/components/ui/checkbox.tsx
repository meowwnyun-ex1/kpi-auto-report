"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cn } from '@/shared/utils'

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const [internalChecked, setInternalChecked] = React.useState(checked || false)
    
    const isControlled = checked !== undefined
    const currentChecked = isControlled ? checked : internalChecked
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = e.target.checked
      if (!isControlled) {
        setInternalChecked(newChecked)
      }
      onCheckedChange?.(newChecked)
    }

    return (
      <div className="relative">
        <input
          type="checkbox"
          ref={ref}
          checked={currentChecked}
          onChange={handleChange}
          className="sr-only"
          {...props}
        />
        <div
          className={cn(
            "peer h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            currentChecked && "bg-blue-600 border-blue-600",
            className
          )}
          onClick={() => {
            const newChecked = !currentChecked
            if (!isControlled) {
              setInternalChecked(newChecked)
            }
            onCheckedChange?.(newChecked)
          }}
        >
          {currentChecked && (
            <Check className="h-3 w-3 text-white" />
          )}
        </div>
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
