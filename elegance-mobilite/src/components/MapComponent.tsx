import { useEffect, useRef, useState } from 'react';
import { useMap } from './MapProvider';
import type { LatLng } from '../lib/types';

interface MapComponentProps {
  markers: {
    position: LatLng;
    address: string;
    color?: string;
    label?: string;
  }[];
  onRouteCalculated?: (distance: string, duration: string) => void;
  zoom?: number;
}

export default function MapComponent({
  markers = [],
  onRouteCalculated,
  zoom = 8
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map>();
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer>();
  const { loader } = useMap();

  // Initialisation de la carte
  useEffect(() => {
    const initMap = async () => {
      if (!loader || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 48.844950, lng: 2.410230 },
        zoom: zoom,
        restriction: {
          latLngBounds: {
            north: 49.2,
            south: 48.3,
            east: 3.5,
            west: 1.5
          },
          strictBounds: false
        },
        disableDefaultUI: true,
        gestureHandling: 'cooperative',
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID
      });

      setMap(map);
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        preserveViewport: false
      });
    };

    initMap();
  }, [loader, zoom]);

  // Calcul de l'itinéraire
  useEffect(() => {
    if (!map || markers.length < 2 || !directionsRendererRef.current) return;

    const directionsService = new google.maps.DirectionsService();

    directionsService.route(
      {
        origin: markers[0].position,
        destination: markers[1].position,
        travelMode: google.maps.TravelMode.DRIVING,
        provideRouteAlternatives: false
      },
      (result, status) => {
        if (status === 'OK' && directionsRendererRef.current && result) {
          directionsRendererRef.current.setDirections(result);
          if (onRouteCalculated && result.routes[0]) {
            const distance = result.routes[0].legs[0]?.distance?.text || '';
            const duration = result.routes[0].legs[0]?.duration?.text || '';
            onRouteCalculated(distance, duration);
          }
        }
      }
    );
  }, [map, markers, onRouteCalculated]);

  return <div ref={mapRef} style={{ height: '100%', width: '100%' }} />;
}