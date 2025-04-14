"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { supabase } from "@/lib/database/client"
import { Layout, Users, Settings, Car, ChevronDown } from "lucide-react"

const NAV_ITEMS = [
  {
    name: "Tableau de bord",
    href: "/backoffice-portal/dashboard",
    icon: Layout,
  },
  {
    name: "Courses",
    href: "/backoffice-portal/rides",
    icon: Car,
  },
  {
    name: "Chauffeurs",
    href: "/backoffice-portal/drivers",
    icon: Users,
  },
  {
    name: "Paramètres",
    href: "/backoffice-portal/settings",
    icon: Settings,
  },
]

export function AdminHeader() {
  const pathname = usePathname() ?? ''
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
    }
  }

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`)

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <div className="mr-4 hidden md:flex">
          <Link
            href="/backoffice-portal"
            className="mr-6 flex items-center space-x-2"
          >
            <span className="font-bold hidden sm:inline-block">
              Vector Elegans • Administration
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "transition-colors hover:text-foreground/80",
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-foreground/60"
                )}
              >
                <span className="hidden lg:block">{item.name}</span>
                <item.icon className="h-5 w-5 lg:hidden" />
              </Link>
            ))}
          </nav>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="inline-flex md:hidden"
          onClick={() => {}}
        >
          <ChevronDown className="h-6 w-6" />
        </Button>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="relative h-8 w-8 rounded-full"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src="/avatars/admin.png"
                  alt="Avatar administrateur"
                />
                <AvatarFallback>AD</AvatarFallback>
              </Avatar>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}
