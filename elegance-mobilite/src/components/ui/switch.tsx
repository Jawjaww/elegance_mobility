import * as React from "react"
import { VariantProps, cva } from "class-variance-authority"

import { cn } from "./utils"

const switchVariants = cva(
  "inline-flex items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-neutral-200 data-[state=checked]:bg-blue-600",
      },
      size: {
        default: "h-6 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const thumbVariants = cva(
  "pointer-events-none block rounded-full bg-white shadow-lg ring-0 transition-transform",
  {
    variants: {
      size: {
        default: "h-5 w-5 translate-x-0.5 data-[state=checked]:translate-x-5",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
)

export interface SwitchProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof switchVariants> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ className, variant, size, checked, onCheckedChange, ...props }, ref) => {
    const [isChecked, setIsChecked] = React.useState(checked || false)

    const handleClick = () => {
      const newChecked = !isChecked
      setIsChecked(newChecked)
      onCheckedChange?.(newChecked)
    }

    return (
      <button
        type="button"
        role="switch"
        className={cn(switchVariants({ variant, size, className }))}
        ref={ref}
        aria-checked={checked ? "true" : "false"} // Convertir en string "true"/"false"
        data-state={isChecked ? "checked" : "unchecked"}
        onClick={handleClick}
        {...props}
      >
        <span
          className={cn(thumbVariants({ size }), {
            'translate-x-0.5': !isChecked,
            'translate-x-5': isChecked
          })}
        />
      </button>
    )
  }
)
Switch.displayName = "Switch"

export { Switch }
