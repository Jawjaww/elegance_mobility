'use client'

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { 
  Wifi, 
  WifiOff, 
  Euro, 
  Clock, 
  Star, 
  Navigation,
  Menu,
  Bell,
  Settings,
  LogOut,
  User2,
  Calendar
} from "lucide-react"
import type { Database } from "@/lib/types/database.types"
import type { User } from "@/lib/types/common.types"
import { supabase } from "@/lib/database/client"

interface DriverHeaderProps {
  user: User
  isOnline?: boolean
  onToggleOnline?: () => void
  todayEarnings?: number
  todayRides?: number
  currentRating?: number
  driverProfile?: {
    avatar_url?: string | null
    first_name?: string | null
    last_name?: string | null
  } | null
}

interface DailyStats {
  earnings: number
  rides: number
  hours: number
}

export function DriverHeader({ 
  user, 
  isOnline = false, 
  onToggleOnline,
  todayEarnings = 0,
  todayRides = 0,
  currentRating = 4.8,
  driverProfile = null
}: DriverHeaderProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [dailyStats, setDailyStats] = useState<DailyStats>({
    earnings: todayEarnings,
    rides: todayRides,
    hours: 0
  })
  const [hasNotifications, setHasNotifications] = useState(true)

  // Simulation du temps de travail (en production, cela viendrait de l'état global)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isOnline) {
      interval = setInterval(() => {
        setDailyStats(prev => ({
          ...prev,
          hours: prev.hours + 0.01 // Incrémente de 0.01h = 36 secondes
        }))
      }, 36000) // Toutes les 36 secondes = 0.01h
    }
    return () => clearInterval(interval)
  }, [isOnline])

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      window.location.href = '/auth/login?from=driver'
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error)
      setIsLoggingOut(false)
    }
  }

  const getAvatarFallback = () => {
    if (driverProfile?.first_name && driverProfile?.last_name) {
      return (driverProfile.first_name[0] + driverProfile.last_name[0]).toUpperCase()
    }
    return user.email?.[0].toUpperCase() ?? 'D'
  }

  const getDriverName = () => {
    if (driverProfile?.first_name && driverProfile?.last_name) {
      return `${driverProfile.first_name} ${driverProfile.last_name}`
    }
    return user.user_metadata?.full_name || user.email
  }

  const formatEarnings = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount / 100)
  }

  const formatHours = (hours: number) => {
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h${m.toString().padStart(2, '0')}`
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-30 bg-transparent">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Section gauche : vide pour laisser la carte visible */}
        <div></div>

        {/* Section droite : Avatar simple et transparent */}
        <div className="flex items-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="relative h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={driverProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-neutral-700 text-white">
                    {getAvatarFallback()}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-black/90 backdrop-blur-sm border-neutral-700" align="end">
              <div className="flex items-center gap-3 p-3 border-b border-neutral-700">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={driverProfile?.avatar_url || undefined} />
                  <AvatarFallback className="bg-neutral-700 text-white">
                    {getAvatarFallback()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {getDriverName()}
                  </p>
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-neutral-400">{currentRating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
              
              <DropdownMenuItem className="flex items-center gap-2 text-white hover:bg-neutral-800">
                <User2 className="h-4 w-4" />
                <span>Mon profil</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem className="flex items-center gap-2 text-white hover:bg-neutral-800">
                <Settings className="h-4 w-4" />
                <span>Paramètres</span>
              </DropdownMenuItem>
              
              <div className="border-t border-neutral-700 my-2" />
              
              <DropdownMenuItem
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex items-center gap-2 text-red-400 hover:bg-neutral-800 focus:text-red-400"
              >
                <LogOut className="h-4 w-4" />
                <span>{isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
