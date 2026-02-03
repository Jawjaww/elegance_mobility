'use client'

import { useEffect, useRef, useState } from 'react'
import { useDriverStore } from '@/stores/driverStore'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

export function DriverMap() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const marker = useRef<maplibregl.Marker | null>(null)
  const { currentLocation, isOnline } = useDriverStore()
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // Initialiser la carte
  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap &copy; CARTO'
          }
        },
        layers: [{
          id: 'osm',
          type: 'raster',
          source: 'osm'
        }]
      },
      center: [2.3522, 48.8566], // Paris par défaut
      zoom: 13,
      attributionControl: false
    })

    map.current.on('load', () => {
      setIsMapLoaded(true)
      // Ajouter contrôle de géoloc
      map.current?.addControl(
        new maplibregl.GeolocateControl({
          positionOptions: { enableHighAccuracy: true },
          trackUserLocation: true
        }),
        'bottom-right'
      )
    })

    return () => {
      map.current?.remove()
    }
  }, [])

  // Mettre à jour la position du marker
  useEffect(() => {
    if (!map.current || !currentLocation || !isMapLoaded) return

    const { lat, lng, heading } = currentLocation

    if (!marker.current) {
      // Créer le marker driver
      const el = document.createElement('div')
      el.className = 'driver-marker'
      el.innerHTML = `
        <div class="relative">
          <div class="w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg"></div>
          <div class="absolute inset-0 w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
        </div>
      `
      
      marker.current = new maplibregl.Marker({
        element: el,
        rotation: heading || 0
      })
        .setLngLat([lng, lat])
        .addTo(map.current)
    } else {
      marker.current.setLngLat([lng, lat])
      if (heading) {
        marker.current.setRotation(heading)
      }
    }

    // Centrer la carte sur la position (sans animation si déjà centrée)
    map.current.easeTo({
      center: [lng, lat],
      duration: 1000
    })
  }, [currentLocation, isMapLoaded])

  return (
    <div className="relative w-full h-full min-h-[400px] bg-neutral-900 rounded-2xl overflow-hidden">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {!isMapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-neutral-950">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-500 border-t-transparent" />
        </div>
      )}

      {/* Overlay status */}
      {isOnline && (
        <div className="absolute top-4 left-4 px-3 py-1.5 bg-green-500/90 backdrop-blur-sm rounded-full flex items-center gap-2">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          <span className="text-sm font-medium text-white">En ligne</span>
        </div>
      )}

      {/* Stats overlay */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-neutral-950/90 backdrop-blur-md rounded-xl p-3 border border-neutral-800">
          <div className="flex items-center justify-between text-sm">
            <span className="text-neutral-400">
              {currentLocation ? '📍 GPS actif' : '📍 Recherche GPS...'}
            </span>
            {currentLocation && (
              <span className="text-neutral-500 text-xs">
                {currentLocation.lat.toFixed(4)}, {currentLocation.lng.toFixed(4)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
