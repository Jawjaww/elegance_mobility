"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface AdminListCardProps {
  title: string
  children: React.ReactNode
  className?: string
  headerAction?: React.ReactNode
  compact?: boolean
}

export function AdminListCard({
  title,
  children,
  className,
  headerAction,
  compact = false,
}: AdminListCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden",
      "bg-neutral-900/90",
      "border-neutral-800",
      className
    )}>
      <CardHeader className={cn(
        "flex flex-row items-center justify-between",
        "border-b border-neutral-800",
        compact ? "p-3 md:p-4" : "p-4 md:p-6",
        "bg-neutral-900/50 backdrop-blur-sm"
      )}>
        <CardTitle className="text-base md:text-lg text-neutral-100">
          {title}
        </CardTitle>
        {headerAction && (
          <div className="flex items-center space-x-2">
            {headerAction}
          </div>
        )}
      </CardHeader>
      <CardContent className={cn(
        "grid gap-4",
        compact ? "p-3 md:p-4" : "p-4 md:p-6",
        "bg-neutral-900/50"
      )}>
        {children}
      </CardContent>
    </Card>
  )
}

interface AdminListItemProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}

export function AdminListItem({
  children,
  className,
  onClick
}: AdminListItemProps) {
  return (
    <div 
      className={cn(
        "relative group rounded-lg",
        "border border-neutral-800",
        "bg-neutral-900/50 backdrop-blur-sm",
        "p-3 md:p-4",
        "hover:bg-neutral-800/50",
        "transition-colors duration-200",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

interface AdminListItemSkeletonProps {
  count?: number
}

export function AdminListItemSkeleton({ count = 3 }: AdminListItemSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-neutral-800 p-4"
        >
          <div className="h-6 w-1/3 bg-neutral-800 rounded" />
          <div className="space-y-2 mt-3">
            <div className="h-4 w-full bg-neutral-800 rounded" />
            <div className="h-4 w-2/3 bg-neutral-800 rounded" />
          </div>
        </div>
      ))}
    </>
  )
}