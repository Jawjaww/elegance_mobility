'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/styles/client-map.css';
import { MapLoading } from '@/components/ui/loading';


// Style raster OSM simple
const rasterStyle = {
  version: 8 as const,
  sources: {
    'osm-tiles': {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap Contributors',
    }
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster' as const,
      source: 'osm-tiles',
    }
  ]
};

interface ClientMapProps {
  origin: {lat: number, lon: number} | null;
  destination: {lat: number, lon: number} | null;
  className?: string;
}

export default function ClientConfirmationMap({ origin, destination, className = '' }: ClientMapProps) {

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  // Cacher l'attribution MapLibre/OSM via CSS
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = '.maplibregl-ctrl-attrib { display: none !important; }';
    document.head.appendChild(style);
    return () => { document.head.removeChild(style); };
  }, []);
  
  // Fonction pour calculer l'itinéraire via l'API OSRM (inchangée, mais simplifiée)
  const fetchRoute = async (start: [number, number], end: [number, number]) => {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&geometries=geojson`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      const response = await fetch(url, { signal: controller.signal, cache: 'no-store' }).finally(() => clearTimeout(timeoutId));
      if (!response.ok) throw new Error('Erreur lors de la récupération de l\'itinéraire');
      const data = await response.json();
      if (data.routes && data.routes.length > 0) return data.routes[0].geometry.coordinates;
      return [start, end];
    } catch {
      return [start, end];
    }
  };

  // Fonction pour mettre à jour les marqueurs et l'itinéraire
  const updateMapContent = useCallback(async (mapInstance: maplibregl.Map) => {
    if (!mapInstance || !origin || !destination) return;

    // Nettoyer les anciens marqueurs
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Nettoyer l'ancienne route
    try {
      if (mapInstance.getLayer('route-line')) {
        mapInstance.removeLayer('route-line');
      }
      if (mapInstance.getSource('route')) {
        mapInstance.removeSource('route');
      }
    } catch (e) {
      // Ignore les erreurs de nettoyage
    }

    setLoading(true);

    // Marqueur d'origine
    if (origin) {
      const el = document.createElement('div');
      el.className = 'client-marker client-marker-departure';
      const marker = new maplibregl.Marker(el)
        .setLngLat([origin.lon, origin.lat])
        .addTo(mapInstance);
      markersRef.current.push(marker);
    }

    // Marqueur de destination
    if (destination) {
      const el = document.createElement('div');
      el.className = 'client-marker client-marker-destination';
      const marker = new maplibregl.Marker(el)
        .setLngLat([destination.lon, destination.lat])
        .addTo(mapInstance);
      markersRef.current.push(marker);
    }

    // Tracé de l'itinéraire
    if (origin && destination) {
      const coordinates = await fetchRoute(
        [origin.lon, origin.lat],
        [destination.lon, destination.lat]
      );
      
      mapInstance.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: coordinates
          }
        }
      });
      
      mapInstance.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
          'visibility': 'visible',
        },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 4,
          'line-opacity': 0.9
        }
      });

      // fitBounds optimisé (12 points max)
      if (coordinates.length > 0) {
        const maxBoundsPoints = 12;
        let boundsPoints: [number, number][] = [];
        if (coordinates.length <= maxBoundsPoints) {
          boundsPoints = coordinates;
        } else {
          boundsPoints = [coordinates[0]];
          for (let i = 1; i < maxBoundsPoints - 1; i++) {
            const idx = Math.round(i * (coordinates.length - 1) / (maxBoundsPoints - 1));
            boundsPoints.push(coordinates[idx]);
          }
          boundsPoints.push(coordinates[coordinates.length - 1]);
        }
        const bounds = new maplibregl.LngLatBounds();
        boundsPoints.forEach((coord: [number, number]) => {
          bounds.extend(coord as maplibregl.LngLatLike);
        });
        mapInstance.fitBounds(bounds, {
          padding: 40,
          maxZoom: 15
        });
      }
    }

    setLoading(false);
  }, [origin, destination]);

  // Initialisation unique de la carte
  useEffect(() => {
    if (!mapContainer.current || isInitialized) return;

    // Définir le centre initial
    const centerPoint = origin && destination
      ? [(origin.lon + destination.lon) / 2, (origin.lat + destination.lat) / 2]
      : origin
        ? [origin.lon, origin.lat]
        : destination
          ? [destination.lon, destination.lat]
          : [2.3488, 48.8534]; // Paris par défaut

    // Créer la carte raster OSM
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: rasterStyle,
      center: centerPoint as [number, number],
      zoom: 12,
      minZoom: 4,
      maxZoom: 16,
      trackResize: true,
      boxZoom: false,
      pitchWithRotate: false,
      attributionControl: false
    });

    map.current = mapInstance;
    setIsInitialized(true);

    mapInstance.on('load', () => {
      updateMapContent(mapInstance);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      setIsInitialized(false);
    };
  }, []);

  // Mise à jour du contenu quand origin/destination changent
  useEffect(() => {
    if (map.current && isInitialized && map.current.isStyleLoaded()) {
      updateMapContent(map.current);
    }
  }, [origin, destination, updateMapContent, isInitialized]);

  return (
    <div style={{ position: 'relative' }}>
      <div
        ref={mapContainer}
        className={`client-map-confirmation client-portal-map ${className}`}
        style={{ visibility: 'visible', display: 'block' }}
      />
      <MapLoading show={loading} text="Chargement de la carte..." />
    </div>
  );
}
