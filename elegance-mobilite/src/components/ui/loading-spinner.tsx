import { cn } from "@/lib/utils"

interface SpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  variant?: "default" | "dots" | "pulse"
}

export function LoadingSpinner({ size = "md", className, variant = "default" }: SpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12",
  }

  const dotSizes = {
    sm: "w-1 h-1",
    md: "w-2 h-2",
    lg: "w-3 h-3",
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex space-x-1 justify-center items-center", className)}>
        <div className={cn("bg-blue-400 rounded-full animate-bounce", dotSizes[size])} style={{ animationDelay: "0ms" }}></div>
        <div className={cn("bg-blue-400 rounded-full animate-bounce", dotSizes[size])} style={{ animationDelay: "150ms" }}></div>
        <div className={cn("bg-blue-400 rounded-full animate-bounce", dotSizes[size])} style={{ animationDelay: "300ms" }}></div>
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex justify-center items-center", className)}>
        <div className={cn("bg-blue-400 rounded-full animate-pulse", sizeClasses[size])}></div>
      </div>
    )
  }

  // Default spinning circle with gradient
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-4 border-transparent bg-gradient-to-r from-blue-400 via-blue-500 to-blue-600 bg-clip-border",
        "before:content-[''] before:absolute before:inset-0 before:rounded-full before:border-4 before:border-transparent before:bg-neutral-800 before:bg-clip-padding",
        "relative",
        sizeClasses[size],
        className
      )}
      style={{
        background: `conic-gradient(from 0deg, transparent, #60a5fa, #3b82f6, #2563eb, transparent)`,
        borderRadius: '50%',
      }}
    >
      <div className={cn("absolute inset-1 bg-neutral-950 rounded-full")}></div>
    </div>
  )
}
