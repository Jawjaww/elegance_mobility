/**
 * Hook useDriverLocation
 * Tracking GPS continu du chauffeur avec mise à jour temps réel
 */
'use client'

import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/database/client'
import { useDriverStore } from '@/stores/driverStore'

export function useDriverLocation(enabled: boolean) {
  const watchId = useRef<number | null>(null)
  const lastUpdate = useRef<number>(0)
  const retryCount = useRef(0)
  const { setCurrentLocation } = useDriverStore()

  // Mettre à jour la location sur le serveur
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
      accuracy: coords.accuracy
    }

    // Mettre à jour le store local
    setCurrentLocation(location)

    try {
      // Essayer d'abord la fonction RPC
      const { data, error } = await supabase
        .rpc('update_driver_location', {
          p_lat: location.lat,
          p_lng: location.lng,
          p_heading: location.heading,
          p_speed: location.speed
        })

      if (error) {
        console.warn('[Location] RPC failed, trying direct upsert:', error.message)
        
        // Fallback: upsert direct
        const { error: upsertError } = await supabase
          .from('driver_locations')
          .upsert({
            driver_id: (await supabase.auth.getUser()).data.user?.id,
            lat: location.lat,
            lng: location.lng,
            heading: location.heading,
            speed: location.speed,
            accuracy: location.accuracy,
            is_online: true,
            last_updated: new Date().toISOString()
          }, {
            onConflict: 'driver_id'
          })
        
        if (upsertError) {
          console.error('[Location] Upsert error:', {
            message: upsertError.message,
            details: upsertError.details,
            code: upsertError.code
          })
          // Retry avec backoff
          if (retryCount.current < 3) {
            retryCount.current++
            setTimeout(() => updateLocation(position), 1000 * retryCount.current)
          }
        } else {
          retryCount.current = 0
          console.log('[Location] Updated via upsert')
        }
      } else {
        retryCount.current = 0
        console.log('[Location] Updated via RPC')
      }
    } catch (err: any) {
      console.error('[Location] Failed to update:', err?.message || err)
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
