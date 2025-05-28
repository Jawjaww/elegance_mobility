'use client'

import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Link from "next/link"

interface DashboardActionCardProps {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  iconColor?: string
  className?: string
}

export function DashboardActionCard({
  title,
  description,
  icon,
  href,
  iconColor = "text-blue-500",
  className,
}: DashboardActionCardProps) {
  const content = (
    <div className={cn(
      "relative p-6 overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:border-blue-500/30 hover:shadow-md",
      className
    )}>
      <div className="flex gap-4">
        <div className={cn(
          "p-2 rounded-full bg-blue-500/10",
          iconColor
        )}>
          {icon}
        </div>
        <div>
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </div>
  )

  return (
    <Link href={href}>
      {content}
    </Link>
  )
}
