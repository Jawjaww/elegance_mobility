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

// Modern dark vector style (similar to Uber)
const MODERN_STYLE = {
  version: 8 as const,
  sources: {
    'vector-tiles': {
      type: 'vector' as const,
      url: 'https://api.maptiler.com/tiles/v3/tiles.json?key=get_your_own_key',
    }
  },
  layers: [
    // Background
    {
      id: 'background',
      type: 'background' as const,
      paint: { 'background-color': '#0f0f0f' }
    },
    // Water
    {
      id: 'water',
      type: 'fill' as const,
      source: 'vector-tiles',
      'source-layer': 'water',
      paint: { 'fill-color': '#1a1a2e' }
    },
    // Land
    {
      id: 'land',
      type: 'fill' as const,
      source: 'vector-tiles',
      'source-layer': 'landcover',
      paint: { 'fill-color': '#0f0f0f' }
    },
    // Buildings
    {
      id: 'buildings',
      type: 'fill' as const,
      source: 'vector-tiles',
      'source-layer': 'building',
      paint: { 
        'fill-color': '#1f1f1f',
        'fill-opacity': 0.8
      }
    },
    // Roads - major
    {
      id: 'roads-major',
      type: 'line' as const,
      source: 'vector-tiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'motorway', 'trunk', 'primary'],
      paint: {
        'line-color': '#2d2d2d',
        'line-width': 2
      }
    },
    // Roads - minor
    {
      id: 'roads-minor',
      type: 'line' as const,
      source: 'vector-tiles',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'secondary', 'tertiary', 'minor'],
      paint: {
        'line-color': '#1f1f1f',
        'line-width': 1
      }
    }
  ]
}

// Fallback to raster style if vector fails
const RASTER_STYLE = {
  version: 8 as const,
  sources: {
    'carto-dark': {
      type: 'raster' as const,
      tiles: ['https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'],
      tileSize: 256,
      attribution: '&copy; CARTO'
    }
  },
  layers: [{
    id: 'carto-dark-layer',
    type: 'raster' as const,
    source: 'carto-dark'
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

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style: RASTER_STYLE as any,
        center: [2.3522, 48.8566],
        zoom: 14,
        attributionControl: false,
        dragRotate: false,
        touchZoomRotate: false
      })

      map.current.on('load', () => {
        setIsLoaded(true)
        // Add 3D buildings if zoomed in
        map.current?.addLayer({
          'id': '3d-buildings',
          'source': 'carto-dark',
          'source-layer': 'building',
          'type': 'fill-extrusion',
          'minzoom': 15,
          'paint': {
            'fill-extrusion-color': '#1a1a1a',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
          }
        } as any)
      })

      map.current.on('error', (e) => {
        console.error('[Map] Error:', e)
      })

    } catch (err) {
      console.error('[Map] Init error:', err)
    }

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
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="16" cy="16" r="14" fill="#10b981" stroke="white" stroke-width="3"/>
          <path d="M16 8L16 14" stroke="white" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `
      el.style.transform = 'translate(-50%, -50%)'
      driverMarker.current = new maplibregl.Marker({ 
        element: el, 
        rotation: heading || 0 
      })
        .setLngLat([lng, lat])
        .addTo(map.current)
    } else {
      driverMarker.current.setLngLat([lng, lat])
      if (heading) driverMarker.current.setRotation(heading)
    }

    map.current.easeTo({ center: [lng, lat], duration: 500 })
  }, [currentLocation, isLoaded])

  // Show pickup/dropoff markers
  useEffect(() => {
    if (!map.current || !isLoaded) return

    if (pickup) {
      if (!pickupMarker.current) {
        const el = document.createElement('div')
        el.innerHTML = `
          <div style="
            width: 36px; height: 36px; 
            background: linear-gradient(135deg, #22c55e, #16a34a);
            border: 3px solid white; 
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
          ">📍</div>
        `
        el.style.transform = 'translate(-50%, -50%)'
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
        el.innerHTML = `
          <div style="
            width: 36px; height: 36px; 
            background: linear-gradient(135deg, #3b82f6, #2563eb);
            border: 3px solid white; 
            border-radius: 50%;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            display: flex; align-items: center; justify-content: center;
            font-size: 16px;
          ">🏁</div>
        `
        el.style.transform = 'translate(-50%, -50%)'
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

    // Fit bounds to show all
    if ((pickup || dropoff) && currentLocation) {
      const bounds = new maplibregl.LngLatBounds()
      if (currentLocation) bounds.extend([currentLocation.lng, currentLocation.lat])
      if (pickup) bounds.extend([pickup.lng, pickup.lat])
      if (dropoff) bounds.extend([dropoff.lng, dropoff.lat])
      map.current.fitBounds(bounds, { padding: { top: 100, bottom: 200, left: 50, right: 50 }, duration: 500 })
    }
  }, [pickup, dropoff, currentLocation, isLoaded])

  return (
    <div className="w-full h-full relative">
      <div ref={mapContainer} className="absolute inset-0" />
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-900">
          <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
