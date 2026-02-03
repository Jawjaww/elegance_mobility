'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useDriverStore } from '@/lib/driver/store'
import { MapPin, Flag } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'

interface MapProps {
  pickup?: { lat: number; lng: number } | null
  dropoff?: { lat: number; lng: number } | null
}

// Style moderne avec POI et noms de rues
const MODERN_STYLE = {
  version: 8,
  glyphs: 'https://tiles.stadiamaps.com/fonts/{fontstack}/{range}.pbf',
  sources: {
    stadia: {
      type: 'vector',
      url: 'https://tiles.stadiamaps.com/data/openmaptiles.json'
    }
  },
  layers: [
    // Water
    {
      id: 'water',
      type: 'fill',
      source: 'stadia',
      'source-layer': 'water',
      paint: { 'fill-color': '#dbeafe' }
    },
    // Land
    {
      id: 'land',
      type: 'fill',
      source: 'stadia',
      'source-layer': 'landcover',
      paint: { 'fill-color': '#ffffff' }
    },
    // Parks
    {
      id: 'park',
      type: 'fill',
      source: 'stadia',
      'source-layer': 'landcover',
      filter: ['in', 'class', 'park', 'forest', 'grass'],
      paint: { 'fill-color': '#dcfce7' }
    },
    // Buildings
    {
      id: 'building',
      type: 'fill',
      source: 'stadia',
      'source-layer': 'building',
      paint: { 
        'fill-color': '#e2e8f0',
        'fill-opacity': 0.7
      }
    },
    // Roads - highways/motorways
    {
      id: 'road-motorway',
      type: 'line',
      source: 'stadia',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'motorway'],
      paint: {
        'line-color': '#3b82f6',
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 3, 16, 12]
      }
    },
    // Roads - primary
    {
      id: 'road-primary',
      type: 'line',
      source: 'stadia',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'primary'],
      paint: {
        'line-color': '#f59e0b',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 16, 10]
      }
    },
    // Roads - secondary
    {
      id: 'road-secondary',
      type: 'line',
      source: 'stadia',
      'source-layer': 'transportation',
      filter: ['==', 'class', 'secondary'],
      paint: {
        'line-color': '#fcd34d',
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 16, 8]
      }
    },
    // Roads - tertiary/residential
    {
      id: 'road-tertiary',
      type: 'line',
      source: 'stadia',
      'source-layer': 'transportation',
      filter: ['in', 'class', 'tertiary', 'residential', 'unclassified'],
      paint: {
        'line-color': '#e2e8f0',
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 16, 6]
      }
    },
    // Road labels
    {
      id: 'road-label',
      type: 'symbol',
      source: 'stadia',
      'source-layer': 'transportation_name',
      filter: ['in', 'class', 'motorway', 'primary', 'secondary', 'tertiary', 'residential'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 10, 16, 13],
        'text-offset': [0, 0.5],
        'symbol-placement': 'line',
        'symbol-spacing': 200
      },
      paint: {
        'text-color': '#475569',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    },
    // POI - Shops, restaurants, etc
    {
      id: 'poi-shop',
      type: 'symbol',
      source: 'stadia',
      'source-layer': 'poi',
      filter: ['in', 'class', 'shop', 'store', 'mall'],
      minzoom: 15,
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-offset': [0, -0.5]
      },
      paint: {
        'text-color': '#059669',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    },
    // POI - Food
    {
      id: 'poi-food',
      type: 'symbol',
      source: 'stadia',
      'source-layer': 'poi',
      filter: ['in', 'class', 'restaurant', 'cafe', 'bar', 'fast_food'],
      minzoom: 15,
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-offset': [0, -0.5]
      },
      paint: {
        'text-color': '#dc2626',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    },
    // POI - Gas stations
    {
      id: 'poi-fuel',
      type: 'symbol',
      source: 'stadia',
      'source-layer': 'poi',
      filter: ['==', 'class', 'fuel'],
      minzoom: 13,
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 11,
        'text-offset': [0, -0.5]
      },
      paint: {
        'text-color': '#ea580c',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    },
    // POI - Parking
    {
      id: 'poi-parking',
      type: 'symbol',
      source: 'stadia',
      'source-layer': 'poi',
      filter: ['==', 'class', 'parking'],
      minzoom: 15,
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 10,
        'text-offset': [0, -0.5]
      },
      paint: {
        'text-color': '#2563eb',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    },
    // Place labels
    {
      id: 'label-place',
      type: 'symbol',
      source: 'stadia',
      'source-layer': 'place',
      filter: ['in', 'class', 'city', 'town', 'village', 'suburb'],
      layout: {
        'text-field': '{name}',
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 12, 14, 18],
        'text-anchor': 'center'
      },
      paint: {
        'text-color': '#1e293b',
        'text-halo-color': '#ffffff',
        'text-halo-width': 2
      }
    },
    // Address labels
    {
      id: 'label-address',
      type: 'symbol',
      source: 'stadia',
      'source-layer': 'housenumber',
      minzoom: 17,
      layout: {
        'text-field': '{housenumber}',
        'text-font': ['Noto Sans Regular'],
        'text-size': 10
      },
      paint: {
        'text-color': '#64748b'
      }
    }
  ]
}

export function Map({ pickup, dropoff }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<{
    driver?: maplibregl.Marker
    pickup?: maplibregl.Marker
    dropoff?: maplibregl.Marker
  }>({})
  
  const { currentLocation } = useDriverStore()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MODERN_STYLE as any,
      center: [2.3522, 48.8566],
      zoom: 13,
      minZoom: 3,
      maxZoom: 20,
      attributionControl: false
    })

    // Zoom rapide avec molette
    let lastZoomTime = 0
    mapContainer.current?.addEventListener('wheel', (e) => {
      const now = Date.now()
      if (now - lastZoomTime < 50) return // Debounce
      lastZoomTime = now
      
      const zoomSpeed = 2 // Plus rapide
      if (e.deltaY < 0) {
        map.current?.zoomIn({ duration: 150, essential: true })
      } else {
        map.current?.zoomOut({ duration: 150, essential: true })
      }
    }, { passive: true })

    // Attribution compacte
    map.current.addControl(new maplibregl.AttributionControl({
      compact: true
    }), 'bottom-right')

    // Contrôles de navigation
    map.current.addControl(new maplibregl.NavigationControl({
      showCompass: true,
      showZoom: true,
      visualizePitch: false
    }), 'bottom-right')

    // Géolocalisation
    map.current.addControl(new maplibregl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserLocation: false // On utilise notre propre marqueur
    }), 'bottom-right')

    map.current.on('load', () => {
      setIsLoaded(true)
      map.current?.resize()
    })

    return () => {
      map.current?.remove()
      map.current = null
    }
  }, [])

  // Update driver marker
  useEffect(() => {
    if (!map.current || !currentLocation || !isLoaded) return

    const { lat, lng, heading } = currentLocation

    if (!markersRef.current.driver) {
      const el = createDriverMarker(heading)
      markersRef.current.driver = new maplibregl.Marker({ 
        element: el,
        anchor: 'center'
      })
        .setLngLat([lng, lat])
        .addTo(map.current)
    } else {
      markersRef.current.driver.setLngLat([lng, lat])
    }

    // Zoom rapide sur position
    map.current.easeTo({ 
      center: [lng, lat], 
      zoom: 16,
      duration: 800,
      easing: (t) => 1 - Math.pow(1 - t, 3) // Ease out cubic
    })
  }, [currentLocation, isLoaded])

  // Update pickup/dropoff markers
  useEffect(() => {
    if (!map.current || !isLoaded) return

    if (pickup) {
      if (!markersRef.current.pickup) {
        const el = createLocationMarker('pickup')
        markersRef.current.pickup = new maplibregl.Marker({ 
          element: el,
          anchor: 'bottom'
        })
          .setLngLat([pickup.lng, pickup.lat])
          .addTo(map.current)
      } else {
        markersRef.current.pickup.setLngLat([pickup.lng, pickup.lat])
      }
    } else {
      markersRef.current.pickup?.remove()
      markersRef.current.pickup = undefined
    }

    if (dropoff) {
      if (!markersRef.current.dropoff) {
        const el = createLocationMarker('dropoff')
        markersRef.current.dropoff = new maplibregl.Marker({ 
          element: el,
          anchor: 'bottom'
        })
          .setLngLat([dropoff.lng, dropoff.lat])
          .addTo(map.current)
      } else {
        markersRef.current.dropoff.setLngLat([dropoff.lng, dropoff.lat])
      }
    } else {
      markersRef.current.dropoff?.remove()
      markersRef.current.dropoff = undefined
    }

    // Fit bounds
    if ((pickup || dropoff) && currentLocation) {
      const bounds = new maplibregl.LngLatBounds()
      bounds.extend([currentLocation.lng, currentLocation.lat])
      if (pickup) bounds.extend([pickup.lng, pickup.lat])
      if (dropoff) bounds.extend([dropoff.lng, dropoff.lat])
      map.current.fitBounds(bounds, { 
        padding: { top: 100, bottom: 200, left: 50, right: 50 }, 
        duration: 600,
        maxZoom: 16
      })
    }
  }, [pickup, dropoff, isLoaded])

  return (
    <div className="w-full h-full relative">
      <div 
        ref={mapContainer} 
        className="absolute inset-0 w-full h-full bg-white"
      />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-slate-500">Chargement...</span>
          </div>
        </div>
      )}
    </div>
  )
}

// Modern driver marker
function createDriverMarker(heading?: number | null) {
  const div = document.createElement('div')
  div.className = 'relative'
  
  // Navigation arrow SVG
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" 
      fill="#3b82f6" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
      style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3)); transform: rotate(${heading || 0}deg); transition: transform 0.3s ease;">
      <polygon points="12 2 2 22 12 18 22 22 12 2"/>
    </svg>
  `
  
  div.innerHTML = svg
  div.style.width = '36px'
  div.style.height = '36px'
  
  return div
}

// Location markers
function createLocationMarker(type: 'pickup' | 'dropoff') {
  const div = document.createElement('div')
  const color = type === 'pickup' ? '#16a34a' : '#2563eb'
  const Icon = type === 'pickup' ? MapPin : Flag
  
  const svg = renderToStaticMarkup(
    <Icon 
      size={40} 
      color={color} 
      fill="white" 
      strokeWidth={2.5}
      style={{ filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.25))' }}
    />
  )
  
  div.innerHTML = svg
  return div
}
