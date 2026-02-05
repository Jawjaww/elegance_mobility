'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface RideRequestMapProps {
  pickup: { lat: number; lng: number }
  dropoff: { lat: number; lng: number }
}

export function RideRequestMap({ pickup, dropoff }: RideRequestMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!mapContainer.current) return

    const mapStyle: maplibregl.StyleSpecification = {
      version: 8,
      glyphs: 'https://tiles.stadiamaps.com/fonts/{fontstack}/{range}.pbf',
      sources: {
        stadia: {
          type: 'vector',
          url: 'https://tiles.stadiamaps.com/data/openmaptiles.json'
        }
      },
      layers: [
        { id: 'water', type: 'fill', source: 'stadia', 'source-layer': 'water', paint: { 'fill-color': '#dbeafe' } },
        { id: 'land', type: 'fill', source: 'stadia', 'source-layer': 'landcover', paint: { 'fill-color': '#f8fafc' } },
        { id: 'park', type: 'fill', source: 'stadia', 'source-layer': 'landcover', filter: ['in', 'class', 'park', 'forest'], paint: { 'fill-color': '#dcfce7' } },
        { id: 'building', type: 'fill', source: 'stadia', 'source-layer': 'building', paint: { 'fill-color': '#e2e8f0', 'fill-opacity': 0.5 } },
        // Routes en orange/jaune
        { id: 'road-motorway', type: 'line', source: 'stadia', 'source-layer': 'transportation', filter: ['==', 'class', 'motorway'], paint: { 'line-color': '#f4a261', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.5, 8, 4, 12, 6] } },
        { id: 'road-trunk', type: 'line', source: 'stadia', 'source-layer': 'transportation', filter: ['==', 'class', 'trunk'], paint: { 'line-color': '#f4a261', 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 1.5, 8, 3.5, 12, 5] } },
        { id: 'road-primary', type: 'line', source: 'stadia', 'source-layer': 'transportation', filter: ['==', 'class', 'primary'], paint: { 'line-color': '#e9c46a', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 1, 9, 3, 13, 4.5] } },
        { id: 'road-secondary', type: 'line', source: 'stadia', 'source-layer': 'transportation', filter: ['==', 'class', 'secondary'], paint: { 'line-color': '#f4d03f', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 1, 10, 2.5, 14, 4] } },
        { id: 'road-tertiary', type: 'line', source: 'stadia', 'source-layer': 'transportation', filter: ['==', 'class', 'tertiary'], paint: { 'line-color': '#fde68a', 'line-width': ['interpolate', ['linear'], ['zoom'], 7, 0.8, 11, 2, 15, 3] } },
        { id: 'road-minor', type: 'line', source: 'stadia', 'source-layer': 'transportation', filter: ['==', 'class', 'minor'], paint: { 'line-color': '#e5e7eb', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 12, 1.5, 16, 2.5] } },
        // Villes
        { id: 'label-country', type: 'symbol', source: 'stadia', 'source-layer': 'place', filter: ['==', 'class', 'country'], layout: { 'text-field': '{name}', 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 2, 10, 6, 20], 'text-transform': 'uppercase' }, paint: { 'text-color': '#64748b', 'text-halo-color': '#fff', 'text-halo-width': 2 } },
        { id: 'label-state', type: 'symbol', source: 'stadia', 'source-layer': 'place', filter: ['==', 'class', 'state'], layout: { 'text-field': '{name}', 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 8, 18] }, paint: { 'text-color': '#475569', 'text-halo-color': '#fff', 'text-halo-width': 2 } },
        { id: 'label-city', type: 'symbol', source: 'stadia', 'source-layer': 'place', filter: ['==', 'class', 'city'], layout: { 'text-field': '{name}', 'text-font': ['Noto Sans Bold'], 'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 10, 22] }, paint: { 'text-color': '#1e293b', 'text-halo-color': '#fff', 'text-halo-width': 3 } },
        { id: 'label-town', type: 'symbol', source: 'stadia', 'source-layer': 'place', filter: ['==', 'class', 'town'], layout: { 'text-field': '{name}', 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 6, 10, 12, 16] }, paint: { 'text-color': '#334155', 'text-halo-color': '#fff', 'text-halo-width': 2 } },
        { id: 'label-village', type: 'symbol', source: 'stadia', 'source-layer': 'place', filter: ['==', 'class', 'village'], layout: { 'text-field': '{name}', 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 10, 10, 14, 14] }, paint: { 'text-color': '#475569', 'text-halo-color': '#fff', 'text-halo-width': 2 } }
      ]
    }

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [(pickup.lng + dropoff.lng) / 2, (pickup.lat + dropoff.lat) / 2],
      zoom: 6,
      attributionControl: false
    })

    map.current = mapInstance

    mapInstance.on('load', async () => {
      // Marqueur pickup
      const pickupEl = document.createElement('div')
      pickupEl.className = 'w-10 h-10 bg-emerald-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center'
      pickupEl.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
      new maplibregl.Marker({ element: pickupEl }).setLngLat([pickup.lng, pickup.lat]).addTo(mapInstance)

      // Marqueur dropoff
      const dropoffEl = document.createElement('div')
      dropoffEl.className = 'w-10 h-10 bg-blue-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center'
      dropoffEl.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>'
      new maplibregl.Marker({ element: dropoffEl }).setLngLat([dropoff.lng, dropoff.lat]).addTo(mapInstance)

      // Récupérer et afficher le tracé
      try {
        const startCoord = `${pickup.lng.toFixed(6)},${pickup.lat.toFixed(6)}`
        const endCoord = `${dropoff.lng.toFixed(6)},${dropoff.lat.toFixed(6)}`
        const response = await fetch(`/api/directions?start=${startCoord}&end=${endCoord}`)
        
        if (response.ok) {
          const data = await response.json()
          if (data.features?.[0]?.geometry?.coordinates) {
            const coordinates = data.features[0].geometry.coordinates

            mapInstance.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: { type: 'LineString', coordinates }
              }
            })

            mapInstance.addLayer({
              id: 'route-line',
              type: 'line',
              source: 'route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: { 'line-color': '#10b981', 'line-width': 6, 'line-opacity': 0.9 }
            })

            // fitBounds simple et fiable
            const bounds = new maplibregl.LngLatBounds()
            coordinates.forEach((coord: [number, number]) => bounds.extend(coord))
            
            mapInstance.fitBounds(bounds, {
              padding: 40,
              maxZoom: 14,
              duration: 0
            })
          }
        }
      } catch (e) {
        console.error('Erreur route:', e)
        // Fallback: ligne droite
        mapInstance.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [[pickup.lng, pickup.lat], [dropoff.lng, dropoff.lat]] }
          }
        })
        mapInstance.addLayer({
          id: 'route-line',
          type: 'line',
          source: 'route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#10b981', 'line-width': 6, 'line-opacity': 0.9 }
        })
        
        const bounds = new maplibregl.LngLatBounds()
        bounds.extend([pickup.lng, pickup.lat])
        bounds.extend([dropoff.lng, dropoff.lat])
        mapInstance.fitBounds(bounds, {
          padding: 40,
          maxZoom: 14,
          duration: 0
        })
      }

      setIsReady(true)
    })

    return () => {
      mapInstance.remove()
    }
  }, [pickup, dropoff])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      {!isReady && (
        <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
