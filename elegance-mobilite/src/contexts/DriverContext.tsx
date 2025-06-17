'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface DriverStats {
  earnings: number
  rides: number
  hours: number
  rating: number
}

interface DriverContextType {
  isOnline: boolean
  setIsOnline: (online: boolean) => void
  todayStats: DriverStats
  setTodayStats: (stats: DriverStats) => void
  toggleOnlineStatus: () => void
}

const DriverContext = createContext<DriverContextType | null>(null)

interface DriverProviderProps {
  children: ReactNode
}

export function DriverProvider({ children }: DriverProviderProps) {
  const [isOnline, setIsOnline] = useState(false)
  const [todayStats, setTodayStats] = useState<DriverStats>({
    earnings: 0,
    rides: 0,
    hours: 0,
    rating: 4.8
  })

  const toggleOnlineStatus = () => {
    setIsOnline(!isOnline)
  }

  // Simulation du temps de travail quand en ligne
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isOnline) {
      interval = setInterval(() => {
        setTodayStats(prev => ({
          ...prev,
          hours: prev.hours + 0.001 // Incrémente très lentement pour la démo
        }))
      }, 3600) // Toutes les 3.6 secondes = 0.001h
    }
    return () => clearInterval(interval)
  }, [isOnline])

  const value = {
    isOnline,
    setIsOnline,
    todayStats,
    setTodayStats,
    toggleOnlineStatus
  }

  return (
    <DriverContext.Provider value={value}>
      {children}
    </DriverContext.Provider>
  )
}

export function useDriver() {
  const context = useContext(DriverContext)
  if (!context) {
    throw new Error('useDriver must be used within a DriverProvider')
  }
  return context
}
