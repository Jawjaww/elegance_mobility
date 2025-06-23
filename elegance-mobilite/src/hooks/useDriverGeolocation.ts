/**
 * Hook to manage driver geolocation
 * Updates driver location and syncs with UI store
 */

import { useEffect, useRef } from 'react'
import { useDriverUIStore } from '@/stores/driverUIStore'

interface GeolocationOptions {
  enableHighAccuracy?: boolean
  timeout?: number
  maximumAge?: number
  minUpdateInterval?: number // Minimum time between updates in ms
}

const DEFAULT_OPTIONS: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000, // 10 seconds
  maximumAge: 30000, // 30 seconds
  minUpdateInterval: 5000, // 5 seconds between updates
}

/**
 * Hook to track driver location and update UI store
 */
export function useDriverGeolocation(options: GeolocationOptions = {}) {
  const mergedOptions = { ...DEFAULT_OPTIONS, ...options }
  const watchIdRef = useRef<number | null>(null)
  const lastUpdateRef = useRef<number>(0)
  
  const { 
    isOnline, 
    driverLocation, 
    setDriverLocation 
  } = useDriverUIStore()

  useEffect(() => {
    // Only track location when driver is online
    if (!isOnline) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
      return
    }

    // Check if geolocation is available
    if (!navigator.geolocation) {
      console.warn('📍 Geolocation is not supported by this browser')
      return
    }

    console.log('📍 Starting geolocation tracking...')

    const handlePosition = (position: GeolocationPosition) => {
      const now = Date.now()
      
      // Rate limiting: only update if enough time has passed
      if (now - lastUpdateRef.current < mergedOptions.minUpdateInterval!) {
        return
      }

      const newLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        timestamp: now,
      }

      // Check if location has changed significantly (avoid spam updates)
      if (driverLocation) {
        const distance = calculateDistance(
          driverLocation.lat,
          driverLocation.lng,
          newLocation.lat,
          newLocation.lng
        )
        
        // Only update if moved more than 10 meters
        if (distance < 0.01) {
          return
        }
      }

      console.log('📍 Location updated:', newLocation)
      setDriverLocation(newLocation)
      lastUpdateRef.current = now
    }

    const handleError = (error: GeolocationPositionError) => {
      console.error('📍 Geolocation error:', error.message)
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          console.warn('📍 Location permission denied')
          break
        case error.POSITION_UNAVAILABLE:
          console.warn('📍 Location information unavailable')
          break
        case error.TIMEOUT:
          console.warn('📍 Location request timed out')
          break
      }
    }

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      handlePosition,
      handleError,
      {
        enableHighAccuracy: mergedOptions.enableHighAccuracy,
        timeout: mergedOptions.timeout,
        maximumAge: mergedOptions.maximumAge,
      }
    )

    // Cleanup on unmount or when going offline
    return () => {
      if (watchIdRef.current !== null) {
        console.log('📍 Stopping geolocation tracking...')
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [isOnline, mergedOptions, driverLocation, setDriverLocation])

  return {
    driverLocation,
    isTracking: isOnline && watchIdRef.current !== null,
  }
}

/**
 * Calculate distance between two points in kilometers
 */
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1)
  const dLng = deg2rad(lng2 - lng1)
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c // Distance in kilometers
  
  return distance
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180)
}
