"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"
import { ArrowUpRight } from "lucide-react"

interface DashboardActionCardProps {
  title: string
  description: string
  href: string
  icon: React.ReactNode
  iconColor?: string
  className?: string
}

export function DashboardActionCard({
  title,
  description,
  href,
  icon,
  iconColor = "text-blue-500",
  className,
}: DashboardActionCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex h-full flex-col justify-between overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900/90 p-6 text-neutral-50 transition-colors hover:border-neutral-700 hover:bg-neutral-900/95",
        className
      )}
    >
      <div>
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-neutral-800 bg-neutral-900">
          <div className={cn("h-6 w-6", iconColor)}>
            {icon}
          </div>
        </div>
        <h3 className="mb-2 font-semibold leading-none tracking-tight">
          {title}
        </h3>
        <p className="text-sm text-neutral-400">
          {description}
        </p>
      </div>
      <div className="absolute bottom-6 right-6">
        <ArrowUpRight className="h-5 w-5 text-neutral-600 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-400" />
      </div>
    </Link>
  )
}
