/**
 * Hook useDriverLocation
 * Tracking GPS continu du chauffeur avec mise à jour temps réel
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/database/client'
import { pushDriverLocation } from '@/lib/services/locationService'
import { useDriverStore } from '@/stores/driverStore'

export function useDriverLocation(enabled: boolean) {
  const watchId = useRef<number | null>(null)
  const lastUpdate = useRef<number>(0)
  const retryCount = useRef(0)
  const { setCurrentLocation } = useDriverStore()

  const updateLocation = useCallback(async (position: GeolocationPosition) => {
    const now = Date.now()

    // Throttle: max 1 update / 5 secondes
    if (now - lastUpdate.current < 5000) return
    lastUpdate.current = now

    const { coords } = position
    const location = {
      lat: coords.latitude,
      lng: coords.longitude,
      heading: coords.heading,
      speed: coords.speed,
      accuracy: coords.accuracy,
    }

    setCurrentLocation(location)

    try {
      const { data: userData, error: authError } = await supabase.auth.getUser()
      if (authError || !userData.user) {
        console.warn('[Location] Not authenticated, skipping update')
        return
      }

      const { error: rpcError } = await pushDriverLocation(supabase, location)

      if (rpcError) {
        console.error('[Location] update_driver_location failed:', rpcError)
        if (retryCount.current < 3) {
          retryCount.current++
          setTimeout(() => updateLocation(position), 1000 * retryCount.current)
        }
      } else {
        retryCount.current = 0
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : err
      console.error('[Location] Failed to update:', message)
    }
  }, [setCurrentLocation])

  // Gérer le tracking GPS
  useEffect(() => {
    if (!enabled) {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
        console.log('[Location] Tracking stopped')
      }
      return
    }

    // Vérifier support géolocalisation
    if (!navigator.geolocation) {
      console.error('[Location] Geolocation not supported')
      return
    }

    console.log('[Location] Starting tracking...')

    // Options haute précision
    const options: PositionOptions = {
      enableHighAccuracy: true, // GPS si disponible
      maximumAge: 10000,        // Cache max 10s
      timeout: 10000            // Timeout 10s
    }

    // Démarrer le watch
    watchId.current = navigator.geolocation.watchPosition(
      (position) => {
        console.log('[Location] Position update:', {
          lat: position.coords.latitude.toFixed(6),
          lng: position.coords.longitude.toFixed(6),
          accuracy: position.coords.accuracy
        })
        updateLocation(position)
      },
      (error) => {
        console.error('[Location] Error:', error.message)
        // En cas d'erreur, réessayer avec moins de précision
        if (error.code === error.TIMEOUT && watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current)
          watchId.current = navigator.geolocation.watchPosition(
            updateLocation,
            (err) => console.error('[Location] Retry failed:', err),
            { enableHighAccuracy: false, maximumAge: 30000, timeout: 20000 }
          )
        }
      },
      options
    )

    // Cleanup
    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
        watchId.current = null
      }
    }
  }, [enabled, updateLocation])

  return { isTracking: watchId.current !== null }
}

// Hook pour demander la permission de géolocalisation
export async function requestLocationPermission(): Promise<boolean> {
  if (!navigator.geolocation) {
    return false
  }

  try {
    const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
    
    if (permission.state === 'granted') {
      return true
    }
    
    if (permission.state === 'prompt') {
      // La permission sera demandée au premier appel
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => resolve(true),
          () => resolve(false),
          { timeout: 5000 }
        )
      })
    }
    
    return false
  } catch (e) {
    // Fallback pour navigateurs qui ne supportent pas permissions API
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => resolve(true),
        () => resolve(false),
        { timeout: 5000 }
      )
    })
  }
}
