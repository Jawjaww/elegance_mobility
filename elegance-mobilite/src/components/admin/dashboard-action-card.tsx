import { Card } from "@/components/ui/card"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

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
    <Link href={href} className="block">
      <Card
        className={cn(
          "relative overflow-hidden p-6 transition-all",
          "hover:backdrop-blur-lg backdrop-blur-sm",
          "group",
          className
        )}
      >
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={cn(
                "p-2 rounded-lg bg-neutral-100/50 dark:bg-neutral-800/50",
                "transition-colors group-hover:bg-neutral-200/50 dark:group-hover:bg-neutral-700/50",
                iconColor
              )}>
                {icon}
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {title}
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  {description}
                </p>
              </div>
            </div>
            <ArrowRight 
              className={cn(
                "h-5 w-5 text-neutral-400",
                "transition-transform group-hover:translate-x-1"
              )} 
            />
          </div>
        </div>
        <div
          className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-neutral-100/10 dark:to-neutral-800/10"
          aria-hidden="true"
        />
      </Card>
    </Link>
  )
}