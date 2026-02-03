'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useDriverStore } from '@/stores/driverStore'
import { motion } from 'framer-motion'

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
  
  const { currentLocation, isOnline } = useDriverStore()
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-dark': {
            type: 'raster',
            tiles: [
              'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
              'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          }
        },
        layers: [{
          id: 'carto-dark-layer',
          type: 'raster',
          source: 'carto-dark',
          minzoom: 0,
          maxzoom: 22
        }]
      },
      center: [2.3522, 48.8566], // Paris
      zoom: 13,
      pitch: 45, // 3D effect
      bearing: 0,
      attributionControl: false
    })

    // Add navigation control
    map.current.addControl(
      new maplibregl.NavigationControl({
        showCompass: true,
        showZoom: false,
        visualizePitch: true
      }),
      'bottom-right'
    )

    map.current.on('load', () => {
      setIsMapLoaded(true)
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update driver marker position
  useEffect(() => {
    if (!map.current || !currentLocation || !isMapLoaded) return

    const { lat, lng, heading } = currentLocation

    if (!driverMarker.current) {
      // Create custom driver marker element
      const el = document.createElement('div')
      el.innerHTML = `
        <div class="relative">
          <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 border-2 border-white">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-green-500"></div>
        </div>
      `
      el.className = 'driver-marker'
      
      driverMarker.current = new maplibregl.Marker({
        element: el,
        rotation: heading || 0,
        anchor: 'center'
      })
        .setLngLat([lng, lat])
        .addTo(map.current)
    } else {
      driverMarker.current.setLngLat([lng, lat])
      if (heading) {
        driverMarker.current.setRotation(heading)
      }
    }

    // Smooth follow camera
    map.current.easeTo({
      center: [lng, lat],
      duration: 1000,
      easing: (t) => t * (2 - t)
    })
  }, [currentLocation, isMapLoaded])

  // Show pickup/dropoff markers and route
  useEffect(() => {
    if (!map.current || !isMapLoaded) return

    // Pickup marker
    if (pickup) {
      if (!pickupMarker.current) {
        const el = document.createElement('div')
        el.innerHTML = `
          <div class="relative">
            <div class="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/50 border-2 border-white">
              <span class="text-lg">📍</span>
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-green-500"></div>
          </div>
        `
        pickupMarker.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([pickup.lng, pickup.lat])
          .addTo(map.current)
      } else {
        pickupMarker.current.setLngLat([pickup.lng, pickup.lat])
      }
    } else {
      pickupMarker.current?.remove()
      pickupMarker.current = null
    }

    // Dropoff marker
    if (dropoff) {
      if (!dropoffMarker.current) {
        const el = document.createElement('div')
        el.innerHTML = `
          <div class="relative">
            <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/50 border-2 border-white">
              <span class="text-lg">🏁</span>
            </div>
            <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 border-l-6 border-r-6 border-t-6 border-l-transparent border-r-transparent border-t-blue-500"></div>
          </div>
        `
        dropoffMarker.current = new maplibregl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([dropoff.lng, dropoff.lat])
          .addTo(map.current)
      } else {
        dropoffMarker.current.setLngLat([dropoff.lng, dropoff.lat])
      }
    } else {
      dropoffMarker.current?.remove()
      dropoffMarker.current = null
    }

    // Fit bounds to show all markers
    if ((pickup || dropoff) && currentLocation) {
      const bounds = new maplibregl.LngLatBounds()
      
      if (currentLocation) bounds.extend([currentLocation.lng, currentLocation.lat])
      if (pickup) bounds.extend([pickup.lng, pickup.lat])
      if (dropoff) bounds.extend([dropoff.lng, dropoff.lat])
      
      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 300, left: 50, right: 50 },
        duration: 1000
      })
    }
  }, [pickup, dropoff, currentLocation, isMapLoaded])

  // Draw route line
  useEffect(() => {
    if (!map.current || !isMapLoaded || !showRoute) return

    if (pickup && dropoff) {
      // Remove existing route
      if (routeLayer.current) {
        if (map.current.getLayer(routeLayer.current)) {
          map.current.removeLayer(routeLayer.current)
        }
        if (map.current.getSource(routeLayer.current)) {
          map.current.removeSource(routeLayer.current)
        }
      }

      const routeId = 'route-' + Date.now()
      routeLayer.current = routeId

      map.current.addSource(routeId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [pickup.lng, pickup.lat],
              [dropoff.lng, dropoff.lat]
            ]
          }
        }
      })

      map.current.addLayer({
        id: routeId,
        type: 'line',
        source: routeId,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#10b981',
          'line-width': 4,
          'line-opacity': 0.8,
          'line-dasharray': [2, 1]
        }
      })
    }

    return () => {
      if (routeLayer.current && map.current) {
        if (map.current.getLayer(routeLayer.current)) {
          map.current.removeLayer(routeLayer.current)
        }
        if (map.current.getSource(routeLayer.current)) {
          map.current.removeSource(routeLayer.current)
        }
      }
    }
  }, [pickup, dropoff, showRoute, isMapLoaded])

  return (
    <div className="relative w-full h-full bg-neutral-900 rounded-2xl overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {/* Loading state */}
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full"
          />
        </div>
      )}

      {/* Online indicator */}
      {isOnline && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-4 left-4 z-10"
        >
          <div className="bg-neutral-950/90 backdrop-blur-md border border-green-500/30 rounded-full px-3 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-medium text-white">GPS Actif</span>
          </div>
        </motion.div>
      )}

      {/* Location info */}
      {currentLocation && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-4 left-4 right-4 z-10"
        >
          <div className="bg-neutral-950/90 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-neutral-400">
                {currentLocation.lat.toFixed(5)}, {currentLocation.lng.toFixed(5)}
              </span>
              {currentLocation.accuracy && (
                <span className="text-green-400">
                  ±{Math.round(currentLocation.accuracy)}m
                </span>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
