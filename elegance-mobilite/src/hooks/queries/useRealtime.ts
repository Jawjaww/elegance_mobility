/**
 * Hook for Supabase Realtime synchronization with TanStack Query cache
 * Listens to database changes and invalidates appropriate queries
 */

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/database/client'
import { rideKeys } from '@/lib/api/rides'
import { driverKeys } from '@/lib/api/drivers'
import { driversAdminKeys } from '@/lib/api/drivers-admin'

interface UseRealtimeOptions {
  driverId?: string
  enabled?: boolean
}

export function useRealtime({ driverId, enabled = true }: UseRealtimeOptions = {}) {
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!enabled) return

    console.log('🔄 Setting up Realtime subscriptions...')

    // Create a channel for realtime updates
    const channel = supabase
      .channel('app-realtime-updates')
      
      // Listen to rides changes
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'rides' 
        },
        (payload) => {
          console.log('🚗 Ride change detected:', payload)
          
          // Invalidate all rides queries
          queryClient.invalidateQueries({ queryKey: rideKeys.all })
          
          // If we know the driver, invalidate specific queries
          if (driverId) {
            queryClient.invalidateQueries({ queryKey: rideKeys.available(driverId) })
            queryClient.invalidateQueries({ queryKey: rideKeys.scheduled(driverId) })
            queryClient.invalidateQueries({ queryKey: rideKeys.history(driverId) })
          }
          
          // For admin views, invalidate admin queries too
          queryClient.invalidateQueries({ queryKey: driversAdminKeys.all })
        }
      )
      
      // Listen to drivers changes (profile, status, location)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'drivers' 
        },
        (payload) => {
          console.log('👤 Driver change detected:', payload)
          
          // Type-safe access to driver ID from payload
          const changedDriverId = (payload.new as any)?.id || (payload.old as any)?.id
          
          if (changedDriverId && typeof changedDriverId === 'string') {
            // Invalidate specific driver queries
            queryClient.invalidateQueries({ queryKey: driverKeys.profile(changedDriverId) })
            queryClient.invalidateQueries({ queryKey: driverKeys.stats(changedDriverId, 'today') })
            
            // Invalidate admin queries
            queryClient.invalidateQueries({ queryKey: driversAdminKeys.detail(changedDriverId) })
            queryClient.invalidateQueries({ queryKey: driversAdminKeys.lists() })
          }
        }
      )
      
      // Listen to vehicles changes (assignments)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'vehicles' 
        },
        (payload) => {
          console.log('🚙 Vehicle change detected:', payload)
          
          // Invalidate driver queries (vehicle assignments might have changed)
          if (driverId) {
            queryClient.invalidateQueries({ queryKey: driverKeys.profile(driverId) })
          }
          
          // Invalidate admin queries
          queryClient.invalidateQueries({ queryKey: driversAdminKeys.all })
        }
      )
      
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
      })

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up Realtime subscriptions...')
      supabase.removeChannel(channel)
    }
  }, [queryClient, driverId, enabled])

  return {
    // Could return subscription status or controls if needed
    isConnected: true // For now, assume connected
  }
}

/**
 * Hook specifically for driver portal realtime updates
 */
export function useDriverRealtime(driverId: string) {
  return useRealtime({ driverId, enabled: !!driverId })
}

/**
 * Hook specifically for admin portal realtime updates
 */
export function useAdminRealtime() {
  return useRealtime({ enabled: true })
}
