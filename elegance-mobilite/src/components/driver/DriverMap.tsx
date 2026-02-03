'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useDriverStore } from '@/stores/driverStore'

interface DriverMapProps {
  pickup?: { lat: number; lng: number } | null
  dropoff?: { lat: number; lng: number } | null
  showRoute?: boolean
}

// CARTO Light - carte claire moderne
const MAP_STYLE = {
  version: 8 as const,
  sources: {
    'carto-light': {
      type: 'raster' as const,
      tiles: ['https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'],
      tileSize: 256,
      attribution: '&copy; CARTO'
    }
  },
  layers: [{
    id: 'carto-light-layer',
    type: 'raster' as const,
    source: 'carto-light'
  }]
}

export function DriverMap({ pickup, dropoff, showRoute = false }: DriverMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const driverMarker = useRef<maplibregl.Marker | null>(null)
  const pickupMarker = useRef<maplibregl.Marker | null>(null)
  const dropoffMarker = useRef<maplibregl.Marker | null>(null)
  
  const { currentLocation } = useDriverStore()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE as any,
      center: [2.3522, 48.8566],
      zoom: 14,
      attributionControl: false
    })

    map.current.on('load', () => setIsLoaded(true))

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Driver position
  useEffect(() => {
    if (!map.current || !currentLocation || !isLoaded) return

    const { lat, lng } = currentLocation

    if (!driverMarker.current) {
      const el = document.createElement('div')
      el.innerHTML = `<div style="width:24px;height:24px;background:#10b981;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>`
      driverMarker.current = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current)
    } else {
      driverMarker.current.setLngLat([lng, lat])
    }

    map.current.easeTo({ center: [lng, lat], duration: 500 })
  }, [currentLocation, isLoaded])

  // Pickup/Dropoff markers
  useEffect(() => {
    if (!map.current || !isLoaded) return

    if (pickup) {
      if (!pickupMarker.current) {
        const el = document.createElement('div')
        el.innerHTML = `<div style="width:32px;height:32px;background:#22c55e;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">📍</div>`
        pickupMarker.current = new maplibregl.Marker({ element: el })
          .setLngLat([pickup.lng, pickup.lat])
          .addTo(map.current)
      } else {
        pickupMarker.current.setLngLat([pickup.lng, pickup.lat])
      }
    } else {
      pickupMarker.current?.remove()
      pickupMarker.current = null
    }

    if (dropoff) {
      if (!dropoffMarker.current) {
        const el = document.createElement('div')
        el.innerHTML = `<div style="width:32px;height:32px;background:#3b82f6;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">🏁</div>`
        dropoffMarker.current = new maplibregl.Marker({ element: el })
          .setLngLat([dropoff.lng, dropoff.lat])
          .addTo(map.current)
      } else {
        dropoffMarker.current.setLngLat([dropoff.lng, dropoff.lat])
      }
    } else {
      dropoffMarker.current?.remove()
      dropoffMarker.current = null
    }

    if ((pickup || dropoff) && currentLocation) {
      const bounds = new maplibregl.LngLatBounds()
      bounds.extend([currentLocation.lng, currentLocation.lat])
      if (pickup) bounds.extend([pickup.lng, pickup.lat])
      if (dropoff) bounds.extend([dropoff.lng, dropoff.lat])
      map.current.fitBounds(bounds, { padding: 100, duration: 500 })
    }
  }, [pickup, dropoff, currentLocation, isLoaded])

  return (
    <div className="w-full h-full relative bg-gray-100">
      <div ref={mapContainer} className="absolute inset-0" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
