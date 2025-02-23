"use client"

import { cn } from "@/lib/utils"

interface AdminCardGridProps {
  children: React.ReactNode
  className?: string
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

export function AdminCardGrid({
  children,
  className,
  columns = {
    default: 1,  // Mobile (<640px)
    sm: 2,       // Small tablets (≥640px)
    md: 2,       // iPad Air/tablets (≥768px)
    lg: 3,       // Small laptop (≥1024px)
    xl: 4,       // Desktop (≥1280px)
  },
}: AdminCardGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4",
        {
          'grid-cols-1': columns.default === 1,
          'grid-cols-2': columns.default === 2,
          'grid-cols-3': columns.default === 3,
          'grid-cols-4': columns.default === 4,
        },
        {
          'sm:grid-cols-1': columns.sm === 1,
          'sm:grid-cols-2': columns.sm === 2,
          'sm:grid-cols-3': columns.sm === 3,
          'sm:grid-cols-4': columns.sm === 4,
        },
        {
          'md:grid-cols-1': columns.md === 1,
          'md:grid-cols-2': columns.md === 2,
          'md:grid-cols-3': columns.md === 3,
          'md:grid-cols-4': columns.md === 4,
        },
        {
          'lg:grid-cols-1': columns.lg === 1,
          'lg:grid-cols-2': columns.lg === 2,
          'lg:grid-cols-3': columns.lg === 3,
          'lg:grid-cols-4': columns.lg === 4,
        },
        {
          'xl:grid-cols-1': columns.xl === 1,
          'xl:grid-cols-2': columns.xl === 2,
          'xl:grid-cols-3': columns.xl === 3,
          'xl:grid-cols-4': columns.xl === 4,
        },
        className
      )}
    >
      {children}
    </div>
  )
}