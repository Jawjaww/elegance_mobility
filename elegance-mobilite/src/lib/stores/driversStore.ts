'use client'

import { create } from 'zustand'
import { supabase } from '@/lib/database/client'
import type { Database, User } from '@/lib/types/common.types'

// Types de base
type RideRow = Database['public']['rides']['Row']
type VehicleRow = Database['public']['vehicles']['Row']

interface Driver {
  id: string
  user_id: string
  status: 'active' | 'inactive' | 'suspended'
  first_name: string
  last_name: string
  phone?: string
  license_number?: string
  current_vehicle_id?: string
  default_vehicle_id?: string
  created_at: string
  updated_at: string
}

interface DriverWithDetails extends Driver {
  vehicle?: VehicleRow
  todayStats?: {
    completedRides: number
    totalEarnings: number
    totalDistance: number
    remainingRides: number
  }
}

interface DriversState {
  drivers: DriverWithDetails[]
  activeDriver: DriverWithDetails | null
  loading: boolean
  error: string | null
  // Actions
  fetchDrivers: () => Promise<void>
  fetchDriverDetails: (driverId: string) => Promise<void>
  setActiveDriver: (driver: DriverWithDetails | null) => void
  updateDriverStatus: (driverId: string, status: Driver['status']) => Promise<void>
  assignVehicle: (driverId: string, vehicleId: string) => Promise<void>
  fetchDriverDailyStats: (driverId: string) => Promise<void>
}

export const useDriversStore = create<DriversState>((set, get) => ({
  drivers: [],
  activeDriver: null,
  loading: false,
  error: null,

  fetchDrivers: async () => {
    set({ loading: true, error: null })
    try {
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select(`
          *,
          vehicles (*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Récupérer les informations utilisateur pour chaque chauffeur
      const driversWithDetails: DriverWithDetails[] = await Promise.all(
        drivers.map(async (driver) => {
          // Utilise le client browser pour l'authentification
          const { data: { user } } = await supabase.auth.getUser()
          return {
            ...driver,
            user,
            vehicle: driver.vehicles as VehicleRow
          }
        })
      )

      set({
        drivers: driversWithDetails,
        loading: false
      })
    } catch (error: any) {
      console.error('Erreur lors de la récupération des chauffeurs:', error)
      set({
        error: error.message || 'Erreur lors de la récupération des chauffeurs',
        loading: false
      })
    }
  },

  fetchDriverDetails: async (driverId: string) => {
    try {
      const { data: driver, error } = await supabase
        .from('drivers')
        .select(`
          *,
          vehicles (*)
        `)
        .eq('id', driverId)
        .single()

      if (error) throw error

      // Utilise le client browser pour l'authentification
      const { data: { user } } = await supabase.auth.getUser()
      
      // Mise à jour du driver dans le state
      set((state) => ({
        drivers: state.drivers.map(d => 
          d.id === driverId 
            ? { ...driver, user, vehicle: driver.vehicles as VehicleRow }
            : d
        )
      }))

    } catch (error: any) {
      console.error('Erreur lors de la récupération des détails:', error)
    }
  },

  setActiveDriver: (driver) => {
    set({ activeDriver: driver })
  },

  updateDriverStatus: async (driverId: string, status: Driver['status']) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)

      if (error) throw error

      // Mise à jour optimiste du state
      set((state) => ({
        drivers: state.drivers.map((driver) =>
          driver.id === driverId
            ? { ...driver, status, updated_at: new Date().toISOString() }
            : driver
        ),
      }))

      // Mettre à jour activeDriver si nécessaire
      const activeDriver = get().activeDriver
      if (activeDriver && activeDriver.id === driverId) {
        set({
          activeDriver: {
            ...activeDriver,
            status,
            updated_at: new Date().toISOString()
          }
        })
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error)
      // Recharger en cas d'erreur
      get().fetchDrivers()
    }
  },

  assignVehicle: async (driverId: string, vehicleId: string) => {
    try {
      const { error } = await supabase
        .from('drivers')
        .update({ 
          current_vehicle_id: vehicleId,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId)

      if (error) throw error

      // Récupérer les détails du véhicule
      const { data: vehicle } = await supabase
        .from('vehicles')
        .select('*')
        .eq('id', vehicleId)
        .single()

      // Mise à jour optimiste du state
      set((state) => ({
        drivers: state.drivers.map((driver) =>
          driver.id === driverId
            ? { 
                ...driver, 
                current_vehicle_id: vehicleId,
                vehicle,
                updated_at: new Date().toISOString()
              }
            : driver
        ),
      }))

      // Mettre à jour activeDriver si nécessaire
      const activeDriver = get().activeDriver
      if (activeDriver && activeDriver.id === driverId) {
        set({
          activeDriver: {
            ...activeDriver,
            current_vehicle_id: vehicleId,
            vehicle,
            updated_at: new Date().toISOString()
          }
        })
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'assignation du véhicule:', error)
      // Recharger en cas d'erreur
      get().fetchDrivers()
    }
  },

  fetchDriverDailyStats: async (driverId: string) => {
    try {
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const { data: rides, error } = await supabase
        .from('rides')
        .select('*')
        .eq('driver_id', driverId)
        .gte('pickup_time', today.toISOString())
        .lt('pickup_time', new Date(today.getTime() + 24*60*60*1000).toISOString())

      if (error) throw error

      const stats = rides.reduce((acc, ride: RideRow) => ({
        completedRides: acc.completedRides + (ride.status === 'completed' ? 1 : 0),
        totalEarnings: acc.totalEarnings + (ride.status === 'completed' ? (ride.final_price || 0) : 0),
        totalDistance: acc.totalDistance + (ride.distance || 0),
        remainingRides: acc.remainingRides + (['assigned', 'accepted', 'in_progress'].includes(ride.status) ? 1 : 0)
      }), {
        completedRides: 0,
        totalEarnings: 0,
        totalDistance: 0,
        remainingRides: 0
      })

      // Mise à jour du driver avec les stats
      set((state) => ({
        drivers: state.drivers.map(driver =>
          driver.id === driverId
            ? { ...driver, todayStats: stats }
            : driver
        ),
        activeDriver: state.activeDriver?.id === driverId
          ? { ...state.activeDriver, todayStats: stats }
          : state.activeDriver
      }))

    } catch (error: any) {
      console.error('Erreur lors de la récupération des statistiques:', error)
    }
  }
}))

// Setup des souscriptions en temps réel
if (typeof window !== 'undefined') {
  supabase
    .channel('store-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'drivers' },
      () => useDriversStore.getState().fetchDrivers()
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rides' },
      (payload: { new: { driver_id?: string } }) => {
        if (payload.new?.driver_id) {
          useDriversStore.getState().fetchDriverDailyStats(payload.new.driver_id)
        }
      }
    )
    .subscribe()
}

export default useDriversStore
