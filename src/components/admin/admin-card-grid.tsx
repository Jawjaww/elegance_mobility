"use client"

interface ColumnConfig {
  default: number
  sm?: number
  md?: number
  lg?: number
  xl?: number
  "2xl"?: number
}

interface AdminCardGridProps {
  children: React.ReactNode
  columns?: ColumnConfig
  className?: string
}

export function AdminCardGrid({
  children,
  columns = {
    default: 1,
    sm: 2,
    lg: 3,
  },
  className = "",
}: AdminCardGridProps) {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
    5: "grid-cols-5",
    6: "grid-cols-6",
  }

  const getResponsiveClasses = () => {
    const classes = [gridCols[columns.default as keyof typeof gridCols]]

    if (columns.sm) {
      classes.push(`sm:${gridCols[columns.sm as keyof typeof gridCols]}`)
    }
    if (columns.md) {
      classes.push(`md:${gridCols[columns.md as keyof typeof gridCols]}`)
    }
    if (columns.lg) {
      classes.push(`lg:${gridCols[columns.lg as keyof typeof gridCols]}`)
    }
    if (columns.xl) {
      classes.push(`xl:${gridCols[columns.xl as keyof typeof gridCols]}`)
    }
    if (columns["2xl"]) {
      classes.push(`2xl:${gridCols[columns["2xl"] as keyof typeof gridCols]}`)
    }

    return classes.join(" ")
  }

  return (
    <div className={`grid gap-4 ${getResponsiveClasses()} ${className}`}>
      {children}
    </div>
  )
}
