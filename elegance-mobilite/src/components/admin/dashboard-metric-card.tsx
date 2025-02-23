import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardMetricCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  trend?: string
  trendIcon?: React.ReactNode
  trendUp?: boolean
  href?: string
  className?: string
}

export function DashboardMetricCard({
  title,
  value,
  icon,
  trend,
  trendIcon,
  trendUp,
  href,
  className,
}: DashboardMetricCardProps) {
  const content = (
    <Card className={cn(
      "relative overflow-hidden",
      "bg-neutral-900/90 border-neutral-800",
      "transition-all hover:bg-neutral-800/90",
      href && "cursor-pointer",
      className
    )}>
      <div className="relative z-10">
        <div className={cn(
          "flex items-center justify-between",
          "p-3 md:p-4"
        )}>
          <div className={cn(
            "p-2 rounded-lg",
            "bg-neutral-800/50",
            "text-neutral-100"
          )}>
            {icon}
          </div>
          {trend && (
            <Badge
              variant={trendUp ? "success" : "warning"}
              className={cn(
                "text-xs flex items-center gap-1 font-medium",
                "px-2 py-0.5"
              )}
            >
              {trendIcon}
              {trend}
            </Badge>
          )}
        </div>
        <div className={cn(
          "space-y-1",
          "px-3 pb-3 md:px-4 md:pb-4"
        )}>
          <p className="text-sm font-medium text-neutral-400">
            {title}
          </p>
          <p className={cn(
            "text-2xl font-bold md:text-3xl",
            "text-neutral-100"
          )}>
            {value}
          </p>
        </div>
      </div>
      <div
        className={cn(
          "absolute inset-0",
          "bg-gradient-to-br from-transparent via-transparent",
          "to-neutral-800/10"
        )}
        aria-hidden="true"
      />
    </Card>
  )

  return href ? (
    <Link href={href}>{content}</Link>
  ) : content
}