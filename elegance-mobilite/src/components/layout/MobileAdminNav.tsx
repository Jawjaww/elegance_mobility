"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layout, Car, Users } from "lucide-react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  {
    href: "/backoffice-portal/dashboard",
    label: "Dashboard",
    icon: Layout,
  },
  {
    href: "/backoffice-portal/rides",
    label: "Courses",
    icon: Car,
  },
  {
    href: "/backoffice-portal/drivers",
    label: "Chauffeurs",
    icon: Users,
  },
]

export function MobileAdminNav() {
  const pathname = usePathname() || ''

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-neutral-950/95 to-neutral-900/90 backdrop-blur-sm border-t border-neutral-700/30 shadow-md shadow-black/10 md:hidden">
      <nav className="flex justify-around items-center h-14 px-3">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center justify-center w-16 h-full transition-all duration-300 group",
                isActive
                  ? "text-blue-400"
                  : "text-neutral-400 hover:text-neutral-200"
              )}
            >
              {isActive && (
                <div className="absolute -top-1.5 w-12 h-1 bg-blue-500 rounded-full opacity-80" />
              )}
              <div className={cn(
                "p-1.5 rounded-full transition-all duration-200",
                isActive
                  ? "bg-blue-500/15 shadow-[0_0_8px_-2px_rgba(96,165,250,0.2)]"
                  : "group-hover:bg-neutral-800/30"
              )}>
                <item.icon className={cn(
                  "h-4.5 w-4.5 transition-all duration-200",
                  isActive ? "scale-[1.15] text-blue-400" : "group-hover:scale-[1.08] text-neutral-300"
                )} />
              </div>
              <span className={cn(
                "text-[0.7rem] font-medium mt-0.5 tracking-tight",
                isActive ? "text-blue-400" : "text-neutral-400"
              )}>{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}