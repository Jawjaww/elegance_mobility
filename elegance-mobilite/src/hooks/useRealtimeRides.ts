/**
 * Hook useRealtimeRides
 * Écoute les nouvelles courses en temps réel via Supabase Realtime
 */
'use client'

import { useEffect, useCallback } from 'react'
import { supabase } from '@/lib/database/client'
import { useDriverStore } from '@/stores/driverStore'
import { useToast } from '@/hooks/useToast'

interface RideRequest {
  id: string
  pickup_address: string
  dropoff_address: string
  pickup_lat: number
  pickup_lng: number
  price: number
  distance_km: number
  estimated_duration_min: number
  passenger_name?: string
  passenger_rating?: number
}

export function useRealtimeRides() {
  const { 
    isOnline, 
    currentLocation,
    setAvailableRide, 
    clearAvailableRide,
    availableRide 
  } = useDriverStore()
  const { toast } = useToast()

  // Écouter les nouvelles courses
  useEffect(() => {
    if (!isOnline) return

    console.log('[Realtime] Subscribing to available rides...')

    const channel = supabase
      .channel('available-rides')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rides',
          filter: 'status=eq.pending'
        },
        (payload) => {
          const ride = payload.new as RideRequest
          console.log('[Realtime] New ride:', ride)

          // Vérifier si une course est déjà en cours
          if (availableRide) {
            console.log('[Realtime] Already have a pending ride request')
            return
          }

          // Vérifier la distance (si on a la location)
          if (currentLocation) {
            const distance = calculateDistance(
              currentLocation.lat,
              currentLocation.lng,
              ride.pickup_lat,
              ride.pickup_lng
            )
            
            // Ignorer si trop loin (> 20km)
            if (distance > 20) {
              console.log(`[Realtime] Ride too far: ${distance.toFixed(1)}km`)
              return
            }
          }

          // Nouvelle course disponible !
          setAvailableRide(ride as any)
          
          // Feedback haptique et sonore
          vibrateDevice()
          playNotificationSound()
          
          toast({
            title: '🚗 Nouvelle course !',
            description: `${ride.pickup_address} → ${ride.dropoff_address}`,
            duration: 15000 // 15 secondes pour décider
          })
        }
      )
      .subscribe((status) => {
        console.log('[Realtime] Subscription status:', status)
      })

    return () => {
      console.log('[Realtime] Unsubscribing...')
      channel.unsubscribe()
    }
  }, [isOnline, currentLocation, setAvailableRide, availableRide, toast])

  // Accepter une course
  const acceptRide = useCallback(async (rideId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('accept_ride', { 
          p_ride_id: rideId,
          p_driver_id: (await supabase.auth.getUser()).data.user?.id
        })

      if (error) throw error

      clearAvailableRide()
      
      toast({
        title: '✅ Course acceptée',
        description: 'Navigation vers le client...'
      })

      return data
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message || 'Impossible d\'accepter la course'
      })
      throw error
    }
  }, [clearAvailableRide, toast])

  // Refuser une course
  const declineRide = useCallback(() => {
    clearAvailableRide()
    toast({
      title: 'Course refusée',
      description: 'Vous recevrez d\'autres propositions'
    })
  }, [clearAvailableRide, toast])

  return { 
    availableRide, 
    acceptRide, 
    declineRide,
    hasPendingRide: !!availableRide 
  }
}

// Calculer distance entre 2 points (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Rayon de la Terre en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Vibration pattern (court, pause, court, pause, LONG)
function vibrateDevice() {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate([200, 100, 200, 100, 500])
  }
}

// Son de notification
function playNotificationSound() {
  try {
    const audio = new Audio('/sounds/new-ride.mp3')
    audio.volume = 0.8
    audio.play()
  } catch (e) {
    console.log('Audio play failed:', e)
  }
}
