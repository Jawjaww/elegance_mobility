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

export function DriverMap({ pickup, dropoff, showRoute = false }: DriverMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const driverMarker = useRef<maplibregl.Marker | null>(null)
  const pickupMarker = useRef<maplibregl.Marker | null>(null)
  const dropoffMarker = useRef<maplibregl.Marker | null>(null)
  const routeLayer = useRef<string | null>(null)
  
  const { currentLocation } = useDriverStore()
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OSM'
          }
        },
        layers: [{
          id: 'osm',
          type: 'raster',
          source: 'osm'
        }]
      },
      center: [2.3522, 48.8566],
      zoom: 14,
      attributionControl: false
    })

    map.current.on('load', () => {
      setIsLoaded(true)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update driver position
  useEffect(() => {
    if (!map.current || !currentLocation || !isLoaded) return

    const { lat, lng, heading } = currentLocation

    if (!driverMarker.current) {
      const el = document.createElement('div')
      el.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background: #10b981;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `
      driverMarker.current = new maplibregl.Marker({ element: el, rotation: heading || 0 })
        .setLngLat([lng, lat])
        .addTo(map.current)
    } else {
      driverMarker.current.setLngLat([lng, lat])
      if (heading) driverMarker.current.setRotation(heading)
    }

    map.current.easeTo({ center: [lng, lat], duration: 500 })
  }, [currentLocation, isLoaded])

  // Show pickup/dropoff
  useEffect(() => {
    if (!map.current || !isLoaded) return

    if (pickup) {
      if (!pickupMarker.current) {
        const el = document.createElement('div')
        el.innerHTML = `<div style="width:24px;height:24px;background:#22c55e;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;">📍</div>`
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
        el.innerHTML = `<div style="width:24px;height:24px;background:#3b82f6;border:3px solid white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;">🏁</div>`
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

    // Fit bounds
    if ((pickup || dropoff) && currentLocation) {
      const bounds = new maplibregl.LngLatBounds()
      if (currentLocation) bounds.extend([currentLocation.lng, currentLocation.lat])
      if (pickup) bounds.extend([pickup.lng, pickup.lat])
      if (dropoff) bounds.extend([dropoff.lng, dropoff.lat])
      map.current.fitBounds(bounds, { padding: 100, duration: 500 })
    }
  }, [pickup, dropoff, currentLocation, isLoaded])

  return (
    <div className="w-full h-full bg-gray-200">
      <div ref={mapContainer} className="w-full h-full" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
