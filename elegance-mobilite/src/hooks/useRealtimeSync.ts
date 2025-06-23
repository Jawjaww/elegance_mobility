/**
 * Hook to integrate Supabase Realtime with TanStack Query
 * Automatically syncs real-time changes with query cache
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/database/client'
import { rideKeys } from '@/lib/api/rides'
import { driverKeys } from '@/lib/api/drivers'
import { driversAdminKeys } from '@/lib/api/drivers-admin'
import type { Database } from '@/lib/types/database.types'

type Tables = Database['public']['Tables']
type RideRow = Tables['rides']['Row']
type DriverRow = Tables['drivers']['Row']

/**
 * Hook to sync real-time Supabase changes with TanStack Query cache
 */
export function useRealtimeSync(driverId?: string) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined') return

    console.log('🔄 Setting up realtime sync...')

    const channel = supabase
      .channel('realtime-sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rides' },
        (payload) => {
          console.log('🚗 Ride change detected:', payload)
          
          const ride = payload.new as RideRow
          const eventType = payload.eventType

          // Invalidate relevant ride queries
          queryClient.invalidateQueries({ queryKey: rideKeys.all })
          
          // If this affects the current driver, invalidate driver-specific queries
          if (driverId && ride.driver_id === driverId) {
            queryClient.invalidateQueries({ queryKey: rideKeys.available(driverId) })
            queryClient.invalidateQueries({ queryKey: rideKeys.scheduled(driverId) })
            queryClient.invalidateQueries({ queryKey: rideKeys.history(driverId) })
            
            // Update driver stats
            queryClient.invalidateQueries({ queryKey: driverKeys.stats(driverId, 'today') })
            queryClient.invalidateQueries({ queryKey: driverKeys.stats(driverId, 'week') })
            queryClient.invalidateQueries({ queryKey: driverKeys.stats(driverId, 'month') })
          }

          // For admin queries, invalidate admin-specific queries
          if (ride.driver_id) {
            queryClient.invalidateQueries({ 
              queryKey: driversAdminKeys.dailyStats(ride.driver_id) 
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'drivers' },
        (payload) => {
          console.log('👤 Driver change detected:', payload)
          
          const driver = payload.new as DriverRow
          const eventType = payload.eventType

          // Invalidate admin driver queries
          queryClient.invalidateQueries({ queryKey: driversAdminKeys.all })
          
          // If this is the current driver, invalidate driver-specific queries
          if (driverId && driver.id === driverId) {
            queryClient.invalidateQueries({ queryKey: driverKeys.profile(driverId) })
          }

          // Invalidate specific driver detail if available
          if (driver.id) {
            queryClient.invalidateQueries({ 
              queryKey: driversAdminKeys.detail(driver.id) 
            })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'vehicles' },
        (payload) => {
          console.log('🚐 Vehicle change detected:', payload)
          
          // Invalidate admin queries that include vehicle details
          queryClient.invalidateQueries({ queryKey: driversAdminKeys.all })
          
          // Invalidate driver profile if this affects current driver
          if (driverId) {
            queryClient.invalidateQueries({ queryKey: driverKeys.profile(driverId) })
          }
        }
      )
      .subscribe((status) => {
        console.log('🔌 Realtime subscription status:', status)
      })

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up realtime subscription...')
      supabase.removeChannel(channel)
    }
  }, [queryClient, driverId])
}

/**
 * Hook specifically for driver portal realtime updates
 */
export function useDriverRealtimeSync(driverId: string) {
  return useRealtimeSync(driverId)
}

/**
 * Hook specifically for admin portal realtime updates
 */
export function useAdminRealtimeSync() {
  return useRealtimeSync()
}
