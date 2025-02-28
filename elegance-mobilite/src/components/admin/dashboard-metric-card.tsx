"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { ArrowUpRight, ArrowDownRight } from "lucide-react"

interface DashboardMetricCardProps {
  title: string
  value: string
  icon?: React.ReactNode
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
    <>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-neutral-400">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <p className="mt-2 text-2xl font-semibold">
              {value}
            </p>
            {trend && (
              <div className={cn(
                "flex items-center gap-0.5 text-sm",
                trendUp ? "text-green-400" : "text-red-400"
              )}>
                {trendUp ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                <span>{trend}</span>
              </div>
            )}
          </div>
        </div>
        {icon && (
          <div className="rounded-full border border-neutral-800 bg-neutral-900 p-2.5">
            {icon}
          </div>
        )}
      </div>

      {href && (
        <div className="absolute bottom-6 right-6">
          <ArrowUpRight className="h-5 w-5 text-neutral-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-400" />
        </div>
      )}
    </>
  )

  const sharedClassName = cn(
    "group relative overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/90 p-6 text-neutral-50 transition-colors hover:border-neutral-700 hover:bg-neutral-900/95",
    className
  )

  if (href) {
    return (
      <Link href={href} className={sharedClassName}>
        {content}
      </Link>
    )
  }

  return (
    <div className={sharedClassName}>
      {content}
    </div>
  )
}
