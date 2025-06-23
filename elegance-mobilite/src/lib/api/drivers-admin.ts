/**
 * API functions for drivers administration
 * Used in backoffice/admin portals
 */

import { supabase } from '@/lib/database/client'
import type { Database } from '@/lib/types/database.types'

type Driver = Database['public']['Tables']['drivers']['Row']
type Vehicle = Database['public']['Tables']['vehicles']['Row']
type Ride = Database['public']['Tables']['rides']['Row']

export interface DriverWithDetails extends Driver {
  vehicle?: Vehicle
  todayStats?: {
    completedRides: number
    totalEarnings: number
    totalDistance: number
    remainingRides: number
  }
}

/**
 * Query keys for admin driver operations
 */
export const driversAdminKeys = {
  all: ['drivers-admin'] as const,
  lists: () => [...driversAdminKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...driversAdminKeys.lists(), { filters }] as const,
  details: () => [...driversAdminKeys.all, 'detail'] as const,
  detail: (id: string) => [...driversAdminKeys.details(), id] as const,
  stats: () => [...driversAdminKeys.all, 'stats'] as const,
  dailyStats: (driverId: string) => [...driversAdminKeys.stats(), 'daily', driverId] as const,
} as const

/**
 * Fetch all drivers with optional vehicle details
 */
export async function fetchDriversAdmin(): Promise<DriverWithDetails[]> {
  console.log('🔍 Fetching drivers for admin...')
  
  const { data: drivers, error: driversError } = await supabase
    .from('drivers')
    .select('*')
    .order('created_at', { ascending: false })

  if (driversError) {
    console.error('❌ Error fetching drivers:', driversError)
    throw driversError
  }

  if (!drivers) {
    return []
  }

  console.log(`✅ ${drivers.length} drivers found`)

  // Fetch vehicle details for each driver
  const driversWithDetails: DriverWithDetails[] = await Promise.all(
    drivers.map(async (driver) => {
      let vehicle: Vehicle | undefined

      if (driver.current_vehicle_id || driver.default_vehicle_id) {
        const vehicleId = driver.current_vehicle_id || driver.default_vehicle_id
        const { data: vehicleData } = await supabase
          .from('vehicles')
          .select('*')
          .eq('id', vehicleId)
          .single()
        
        vehicle = vehicleData || undefined
      }

      return {
        ...driver,
        vehicle
      }
    })
  )

  return driversWithDetails
}

/**
 * Fetch single driver details
 */
export async function fetchDriverDetails(driverId: string): Promise<DriverWithDetails> {
  const { data: driver, error } = await supabase
    .from('drivers')
    .select('*')
    .eq('id', driverId)
    .single()

  if (error) throw error

  let vehicle: Vehicle | undefined

  if (driver.current_vehicle_id || driver.default_vehicle_id) {
    const vehicleId = driver.current_vehicle_id || driver.default_vehicle_id
    const { data: vehicleData } = await supabase
      .from('vehicles')
      .select('*')
      .eq('id', vehicleId)
      .single()
    
    vehicle = vehicleData || undefined
  }

  return {
    ...driver,
    vehicle
  }
}

/**
 * Update driver status
 */
export async function updateDriverStatus(
  driverId: string, 
  status: Driver['status']
): Promise<Driver> {
  const { data, error } = await supabase
    .from('drivers')
    .update({ 
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', driverId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Assign vehicle to driver
 */
export async function assignVehicleToDriver(
  driverId: string, 
  vehicleId: string
): Promise<Driver> {
  const { data, error } = await supabase
    .from('drivers')
    .update({ 
      current_vehicle_id: vehicleId,
      updated_at: new Date().toISOString()
    })
    .eq('id', driverId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Fetch driver daily stats
 */
export async function fetchDriverDailyStats(driverId: string) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)

  const { data: rides, error } = await supabase
    .from('rides')
    .select('*')
    .eq('driver_id', driverId)
    .gte('pickup_time', today.toISOString())
    .lt('pickup_time', tomorrow.toISOString())

  if (error) throw error

  const stats = (rides || []).reduce((acc, ride: Ride) => ({
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

  return stats
}
