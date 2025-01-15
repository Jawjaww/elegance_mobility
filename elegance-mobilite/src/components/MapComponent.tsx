"use client"

import { useEffect, useRef, useState } from 'react'
import { useMap } from './MapProvider'

interface MapComponentProps {
  onPlaceSelected: (place: google.maps.places.PlaceResult) => void
  onRouteCalculated?: (distance: string, duration: string) => void
  origin?: google.maps.LatLngLiteral
  destination?: google.maps.LatLngLiteral
}

export default function MapComponent(props: MapComponentProps) {
  const { isLoaded, loader } = useMap()
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<google.maps.Map>()
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>()

  // Initialize map
  useEffect(() => {
    if (isLoaded && mapRef.current && !map) {
      const mapInstance = new google.maps.Map(mapRef.current, {
        center: { lat: 48.8026, lng: 2.3522 }, // Paris by default
        zoom: 10,
        mapId: 'ELEGANCE_MOBILITE_MAP'
      })

      const renderer = new google.maps.DirectionsRenderer({
        map: mapInstance,
        suppressMarkers: false
      })

      setMap(mapInstance)
      setDirectionsRenderer(renderer)
    }
  }, [isLoaded, map])

  // Handle origin/destination changes
  useEffect(() => {
    console.log('MapComponent - origin:', props.origin)
    console.log('MapComponent - destination:', props.destination)
    
    if (map && directionsRenderer && props.origin && props.destination) {
      const directionsService = new google.maps.DirectionsService()

      directionsService.route({
        origin: props.origin,
        destination: props.destination,
        travelMode: google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: google.maps.TrafficModel.BEST_GUESS
        }
      }, (response, status) => {
        if (status === 'OK' && response && props.onRouteCalculated) {
          directionsRenderer.setDirections(response)
          
          if (response.routes?.[0]?.legs?.[0]) {
            const route = response.routes[0].legs[0]
            const distance = route.distance?.text || 'N/A'
            const duration = route.duration?.text || 'N/A'
            
            props.onRouteCalculated(distance, duration)
          }
        }
      })
    }
  }, [map, directionsRenderer, props.origin, props.destination])

  if (!isLoaded) {
    return <div className="h-[400px] w-full bg-neutral-800 animate-pulse rounded-lg" />
  }

  return (
    <div className="h-[400px] w-full rounded-lg overflow-hidden">
      <div ref={mapRef} className="h-full w-full" />
    </div>
  )
}