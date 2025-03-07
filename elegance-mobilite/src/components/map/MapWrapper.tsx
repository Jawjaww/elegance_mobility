"use client";

import React, { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import L from 'leaflet';
import { Coordinates } from '@/lib/types';

// Composant de secours affiché pendant le chargement
const MapLoadingFallback = () => (
  <div className="h-full w-full flex items-center justify-center bg-neutral-800">
    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    <span className="ml-2 text-neutral-300">Chargement de la carte...</span>
  </div>
);

// Importation dynamique du composant de carte
const DynamicLeafletMap = dynamic(
  () => import('./DynamicLeafletMap'), 
  { 
    ssr: false, // Désactiver le rendu côté serveur
    loading: MapLoadingFallback // Afficher ce composant pendant le chargement
  }
);

interface MapWrapperProps {
  startPoint: Coordinates | null;
  endPoint: Coordinates | null;
  enableRouting?: boolean;
  onRouteCalculated?: (distance: number, duration: number) => void;
  className?: string;
}

// Conversion simple pour Leaflet
const toLatLon = (coords: Coordinates | null): L.LatLon | null => {
  if (!coords) return null;
  return L.latLon(coords.lat, coords.lon);
};

export default function MapWrapper({
  startPoint,
  endPoint,
  enableRouting = false,
  onRouteCalculated,
  className = 'h-full w-full'
}: MapWrapperProps) {
  const mapRef = useRef<L.Map | null>(null);
  const routingControlRef = useRef<any | null>(null);
  
  // Fonction d'initialisation de carte simplifiée
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialiser la carte
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: [48.864716, 2.349014], // Paris par défaut
        zoom: 13
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
      }).addTo(mapRef.current);
    }

    // Gestion des points et routing
    if (startPoint || endPoint) {
      const bounds = L.latLonBounds([]);
      
      if (startPoint) {
        const startLatLon = toLatLon(startPoint);
        if (startLatLon) {
          L.marker(startLatLon).addTo(mapRef.current);
          bounds.extend(startLatLon);
        }
      }
      
      if (endPoint) {
        const endLatLon = toLatLon(endPoint);
        if (endLatLon) {
          L.marker(endLatLon).addTo(mapRef.current);
          bounds.extend(endLatLon);
        }
      }
      
      // Routing entre les points si demandé
      if (enableRouting && startPoint && endPoint) {
        // Code de routing avec Leaflet...
      }
      
      // Ajuster la vue
      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Nettoyage
    return () => {
      if (routingControlRef.current) {
        routingControlRef.current.remove();
        routingControlRef.current = null;
      }
    };
  }, [startPoint, endPoint, enableRouting, onRouteCalculated]);

  return <div id="map" className={className}></div>;
}
