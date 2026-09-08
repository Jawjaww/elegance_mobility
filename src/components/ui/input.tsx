import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

/** Near-black field: darker than the panel, soft blue focus — no white ring-offset. */
export const INPUT_FIELD =
  "flex h-10 w-full rounded-md border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-neutral-100 shadow-none placeholder:text-neutral-500 focus-visible:border-blue-500/55 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(INPUT_FIELD, className)}
        ref={ref}
        suppressHydrationWarning
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
