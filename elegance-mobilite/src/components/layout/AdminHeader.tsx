'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Layout, Users, Settings, Car, LogOut } from "lucide-react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/database/client"

interface AdminHeaderProps {
  user: User
}

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/backoffice-portal",
    icon: Layout,
  },
  {
    name: "Courses",
    href: "/backoffice-portal/courses",
    icon: Car,
  },
  {
    name: "Chauffeurs",
    href: "/backoffice-portal/chauffeurs",
    icon: Users,
  }
]

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname() ?? ''
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return // Éviter les doubles clics
    
    setIsLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Redirection immédiate pour éviter les erreurs de session
      window.location.href = '/backoffice-portal/login'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      setIsLoggingOut(false)
    }
  }

  const getAvatarFallback = () => {
    return user.email?.[0].toUpperCase() ?? 'A'
  }

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-700/30">
      <div className="bg-gradient-to-r from-neutral-950/95 to-neutral-900/90 backdrop-blur-sm">
        <div className="mx-4 flex h-16 items-center">
          <div className="mr-8 hidden md:flex">
            <Link
              href="/backoffice-portal"
              className="mr-10 flex items-center space-x-2"
            >
              <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent font-bold text-xl">
                Vector Elegans
              </span>
            </Link>
            <nav className="flex items-center space-x-10 text-sm font-medium">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center space-x-2 transition-all duration-200 hover:text-blue-400",
                    isActive(item.href)
                      ? "text-blue-400"
                      : "text-neutral-400"
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-full transition-all duration-200",
                    isActive(item.href)
                      ? "bg-blue-500/15 shadow-[0_0_8px_-2px_rgba(96,165,250,0.2)]"
                      : "group-hover:bg-neutral-800/30"
                  )}>
                    <item.icon className={cn(
                      "h-4 w-4",
                      isActive(item.href) ? "text-blue-400" : "text-neutral-400"
                    )} />
                  </div>
                  <span>{item.name}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src="/avatars/admin.png"
                        alt="Avatar administrateur"
                      />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getAvatarFallback()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] p-2">
                  <DropdownMenuItem asChild>
                    <Link
                      href="/backoffice-portal/settings"
                      className="flex items-center gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      <span>Paramètres</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}
