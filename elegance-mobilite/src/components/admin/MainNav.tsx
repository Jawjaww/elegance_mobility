"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const mainNavItems = [
  {
    title: "Tableau de bord",
    href: "/admin",
  },
  {
    title: "Courses",
    href: "/admin/rides",
  },
  {
    title: "Chauffeurs",
    href: "/admin/drivers",
  },
  {
    title: "Véhicules",
    href: "/admin/vehicles",
  },
  {
    title: "Tarifs",
    href: "/admin/rates",
  },
]

export function MainNav() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex items-center space-x-4 lg:space-x-6">
      {mainNavItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-white",
            pathname === item.href
              ? "text-white"
              : "text-gray-400"
          )}
        >
          {item.title}
        </Link>
      ))}
    </nav>
  )
}

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-gray-900 border-t border-gray-800">
      <div className="flex justify-around items-center h-16">
        {mainNavItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full text-xs font-medium transition-colors hover:text-white",
              pathname === item.href
                ? "text-white bg-gray-800"
                : "text-gray-400"
            )}
          >
            {item.title}
          </Link>
        ))}
      </div>
    </nav>
  )
}
