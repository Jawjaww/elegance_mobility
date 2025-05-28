'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Car, Calendar, User2, LogOut } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/database/client"

interface DriverHeaderProps {
  user: User
}

const NAV_ITEMS = [
  {
    name: "Courses du jour",
    href: "/driver-portal/rides",
    icon: Car,
  },
  {
    name: "Planning",
    href: "/driver-portal/schedule",
    icon: Calendar,
  },
  {
    name: "Profil",
    href: "/driver-portal/profile",
    icon: User2,
  }
]

export function DriverHeader({ user }: DriverHeaderProps) {
  const pathname = usePathname() ?? ''

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      // La redirection sera gérée par le middleware
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const getAvatarFallback = () => {
    return user.email?.[0].toUpperCase() ?? 'D'
  }

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-700/30">
      <div className="bg-gradient-to-r from-neutral-950/95 to-neutral-900/90 backdrop-blur-sm">
        <div className="container flex h-16 max-w-screen-2xl items-center">
          <div className="mr-8 flex-1">
            <Link
              href="/driver-portal"
              className="mr-8 flex items-center space-x-2"
            >
              <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent font-bold text-xl">
                Vector Elegans
              </span>
              <span className="text-neutral-400 font-medium">Chauffeur</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium mt-2">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 transition-all duration-200 hover:text-green-400",
                    isActive(item.href)
                      ? "text-green-400"
                      : "text-neutral-400"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-full transition-all duration-200",
                    isActive(item.href)
                      ? "bg-green-500/15 shadow-[0_0_8px_-2px_rgba(74,222,128,0.2)]"
                      : "group-hover:bg-neutral-800/30"
                  )}>
                    <item.icon className={cn(
                      "h-4 w-4",
                      isActive(item.href) ? "text-green-400" : "text-neutral-400"
                    )} />
                  </div>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          <nav className="flex items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src="/avatars/driver.png"
                      alt="Avatar chauffeur"
                    />
                    <AvatarFallback className="bg-green-600 text-white">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] p-2">
                <DropdownMenuItem asChild>
                  <Link
                    href="/driver-portal/profile"
                    className="flex items-center gap-2"
                  >
                    <User2 className="h-4 w-4" />
                    <span>Mon profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Déconnexion</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  )
}
