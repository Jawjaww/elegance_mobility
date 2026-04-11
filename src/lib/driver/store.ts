/**
 * Driver Store - Zustand
 * Gestion centralisée de l'état du chauffeur
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Ride, DriverStats, Location } from './types'

interface DriverState {
  // État online/offline
  isOnline: boolean
  setIsOnline: (online: boolean) => void
  
  // Course en cours/active
  activeRide: Ride | null
  setActiveRide: (ride: Ride | null) => void
  
  // Course disponible (entrante)
  availableRide: Ride | null
  setAvailableRide: (ride: Ride | null) => void
  clearAvailableRide: () => void
  
  // Statistiques
  stats: DriverStats
  updateStats: (stats: Partial<DriverStats>) => void
  
  // Location
  currentLocation: Location | null
  setCurrentLocation: (location: Location | null) => void
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      isOnline: false,
      setIsOnline: (online) => set({ isOnline: online }),
      
      activeRide: null,
      setActiveRide: (ride) => set({ activeRide: ride }),
      
      availableRide: null,
      setAvailableRide: (ride) => set({ availableRide: ride }),
      clearAvailableRide: () => set({ availableRide: null }),
      
      stats: {
        todayEarnings: 0,
        todayRides: 0,
        onlineTimeMinutes: 0,
        rating: 0
      },
      updateStats: (newStats) => 
        set((state) => ({ 
          stats: { ...state.stats, ...newStats } 
        })),
      
      currentLocation: null,
      setCurrentLocation: (location) => set({ currentLocation: location })
    }),
    {
      name: 'driver-storage',
      partialize: (state) => ({ 
        stats: state.stats,
        activeRide: state.activeRide 
      })
    }
  )
)
