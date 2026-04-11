'use client'

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react"

interface DashboardMetricCardProps {
  title: string
  value: string
  icon: React.ReactNode
  trend?: string
  trendUp?: boolean
  href?: string
  className?: string
}

export function DashboardMetricCard({
  title,
  value,
  icon,
  trend,
  trendUp,
  href,
  className,
}: DashboardMetricCardProps) {
  const content = (
    <div className={cn(
      "relative p-6 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200",
      href && "hover:border-blue-500/30 hover:shadow-md",
      className
    )}>
      <div className="flex justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="mt-2 text-2xl font-semibold">
              {value}
            </p>
            {trend && (
              <span className={cn(
                "text-xs font-medium",
                trendUp ? "text-green-500" : "text-red-500"
              )}>
                {trendUp ? <ArrowUpIcon className="inline h-3 w-3" /> : <ArrowDownIcon className="inline h-3 w-3" />}
                {trend}
              </span>
            )}
          </div>
        </div>
        <div className={cn(
          "p-2 rounded-full",
          trend ? (trendUp ? "bg-green-500/10" : "bg-red-500/10") : "bg-blue-500/10"
        )}>
          {icon}
        </div>
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href}>
        {content}
      </Link>
    )
  }

  return <Card>{content}</Card>
}
