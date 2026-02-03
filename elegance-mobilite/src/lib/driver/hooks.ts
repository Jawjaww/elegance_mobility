/**
 * Hooks pour le driver dashboard
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/database/client'
import { useDriverStore } from './store'
import { calculateDistance, vibrateDevice, playNotificationSound } from './utils'
import type { Ride } from './types'

const UPDATE_INTERVAL = 10000 // 10 secondes
const MAX_RETRY = 3

/**
 * Hook useDriverLocation
 * Tracking GPS continu du chauffeur
 */
export function useDriverLocation(enabled: boolean) {
  const watchId = useRef<number | null>(null)
  const lastUpdate = useRef<number>(0)
  const retryCount = useRef(0)
  const { setCurrentLocation } = useDriverStore()

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    const now = Date.now()
    if (now - lastUpdate.current < UPDATE_INTERVAL) return
    lastUpdate.current = now

    const { coords } = position
    const location = {
      lat: coords.latitude,
      lng: coords.longitude,
      heading: coords.heading,
      speed: coords.speed,
      accuracy: coords.accuracy
    }

    setCurrentLocation(location)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Upsert location avec ignoreDuplicates pour éviter les erreurs 409
      const { error } = await supabase
        .from('driver_locations')
        .upsert({
          driver_id: user.id,
          lat: location.lat,
          lon: location.lng,
          heading: location.heading,
          speed: location.speed,
          accuracy: location.accuracy,
          is_online: true,
          recorded_at: new Date().toISOString()
        }, { 
          onConflict: 'driver_id',
          ignoreDuplicates: false 
        })

      if (error && retryCount.current < MAX_RETRY) {
        retryCount.current++
        setTimeout(() => updateLocation(position), 1000 * retryCount.current)
      } else {
        retryCount.current = 0
      }
    } catch (err) {
      console.error('[Location] Update failed:', err)
    }
  }, [setCurrentLocation])

  useEffect(() => {
    if (!enabled || !navigator.geolocation) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
      return
    }

    watchId.current = navigator.geolocation.watchPosition(
      updateLocation,
      (error) => console.error('[Location] Error:', error.message),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
    }
  }, [enabled, updateLocation])

  return { isTracking: watchId.current !== null }
}

/**
 * Hook useRealtimeRides
 * Écoute les nouvelles courses en temps réel
 */
export function useRealtimeRides(onNewRide?: (ride: Ride) => void) {
  const { isOnline, currentLocation, setAvailableRide, availableRide } = useDriverStore()

  useEffect(() => {
    if (!isOnline) return

    const channel = supabase
      .channel('available-rides')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'rides', filter: 'status=eq.pending' },
        (payload) => {
          const ride = payload.new as Ride
          
          // Éviter les doublons
          if (availableRide) return

          // Filtrer par distance si on a la position
          if (currentLocation && ride.pickup_lat && ride.pickup_lng) {
            const dist = calculateDistance(
              currentLocation.lat, currentLocation.lng,
              ride.pickup_lat, ride.pickup_lng
            )
            if (dist > 20) return // Ignorer si > 20km
          }

          setAvailableRide(ride)
          vibrateDevice()
          playNotificationSound()
          onNewRide?.(ride)
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [isOnline, currentLocation, availableRide, setAvailableRide, onNewRide])

  const acceptRide = useCallback(async (rideId: string) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const { error } = await supabase.rpc('accept_ride', {
      p_ride_id: rideId,
      p_driver_id: user.id
    })

    if (error) throw error
    
    const { availableRide } = useDriverStore.getState()
    useDriverStore.setState({ 
      activeRide: availableRide,
      availableRide: null 
    })
  }, [])

  const declineRide = useCallback(() => {
    setAvailableRide(null)
  }, [setAvailableRide])

  return { acceptRide, declineRide, hasPendingRide: !!availableRide }
}

/**
 * Hook useWakeLock
 * Empêche l'écran de s'éteindre
 */
export function useWakeLock(enabled: boolean) {
  const wakeLockRef = useRef<WakeLockSentinel | null>(null)

  const request = useCallback(async () => {
    if (!('wakeLock' in navigator)) return
    try {
      wakeLockRef.current = await navigator.wakeLock!.request('screen')
    } catch (err) {
      console.error('[WakeLock] Failed:', err)
    }
  }, [])

  const release = useCallback(async () => {
    if (wakeLockRef.current && !wakeLockRef.current.released) {
      await wakeLockRef.current.release()
      wakeLockRef.current = null
    }
  }, [])

  useEffect(() => {
    if (enabled) request()
    else release()
    return () => { release() }
  }, [enabled, request, release])

  useEffect(() => {
    if (!enabled) return
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') request()
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [enabled, request])
}

interface WakeLockSentinel {
  released: boolean
  release(): Promise<void>
}
