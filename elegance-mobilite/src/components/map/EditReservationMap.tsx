'use client';

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Location } from '../../lib/types/map-types';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/styles/map.css';
import { useReservationStore } from "@/lib/stores/reservationStore";
import { SectionLoading } from "@/components/ui/loading";

// Version légère et optimisée pour les pages d'édition
export default function EditReservationMap() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const { departure, destination } = useReservationStore();

  // Effet pour nettoyer tout contexte WebGL existant avant de monter
  useEffect(() => {
    // Chercher et nettoyer les contextes WebGL existants
    const canvases = document.getElementsByTagName('canvas');
    for (let i = 0; i < canvases.length; i++) {
      const canvas = canvases[i];
      const gl = canvas.getContext('webgl');
      if (gl) {
        gl.getExtension('WEBGL_lose_context')?.loseContext();
      }
    }
  }, []);

  // Fonction de validation des coordonnées
  const isValidLocation = (loc: Location | null): boolean => {
    return Boolean(
      loc && 
      typeof loc.lat === 'number' && 
      typeof loc.lon === 'number' &&
      !isNaN(loc.lat) && 
      !isNaN(loc.lon)
    );
  };

  // Effet pour gérer l'initialisation et les mises à jour de la carte
  useEffect(() => {
    // Valider les coordonnées
    if (!departure || !destination || !isValidLocation(departure) || !isValidLocation(destination)) {
      return;
    }

    // À ce stade, TypeScript sait que departure et destination sont valides
    const validDeparture = departure as Location;
    const validDestination = destination as Location;

    console.log("[EditMap] Initialisation/mise à jour de la carte MapLibre");
    
    // Si la carte existe déjà, nettoyer les marqueurs existants
    if (map.current) {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Si on a une nouvelle route valide, mettre à jour la source existante
      try {
        const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: [
                [validDeparture.lon, validDeparture.lat],
                [validDestination.lon, validDestination.lat]
              ]
            }
          });
          
          // Ajuster la vue aux nouveaux points
          const bounds = new maplibregl.LngLatBounds()
            .extend([validDeparture.lon, validDeparture.lat])
            .extend([validDestination.lon, validDestination.lat]);
          map.current.fitBounds(bounds, { padding: 50 });
        }
      } catch (e) {
        console.error("[EditMap] Erreur lors de la mise à jour de la route:", e);
      }
      return;
    }

    if (!mapContainer.current) return;

    // Création initiale de la carte
    const mapInstance = new maplibregl.Map({
      container: mapContainer.current as HTMLElement,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: '© OpenStreetMap Contributors',
          }
        },
        layers: [
          {
            id: "osm-tiles-layer",
            type: "raster",
            source: "osm-tiles",
          }
        ]
      },
      // Centrer la carte entre le départ et la destination
      center: [
        (validDeparture.lon + validDestination.lon) / 2,
        (validDeparture.lat + validDestination.lat) / 2
      ] as [number, number],
      zoom: 10,
      attributionControl: false
    });

    mapInstance.on('load', () => {
      console.log("[EditMap] Carte chargée");
      map.current = mapInstance;
      setMapReady(true);
      
      // Ajouter les marqueurs une seule fois
      if (departure) {
        const el = document.createElement('div');
        el.className = 'marker map-marker';
        el.style.backgroundColor = '#28a745';
        
        const marker = new maplibregl.Marker(el)
          .setLngLat([validDeparture.lon, validDeparture.lat])
          .addTo(mapInstance);
        
        markersRef.current.push(marker);
      }

      if (destination) {
        const el = document.createElement('div');
        el.className = 'marker map-marker';
        el.style.backgroundColor = '#dc3545';
        
        const marker = new maplibregl.Marker(el)
          .setLngLat([validDestination.lon, validDestination.lat])
          .addTo(mapInstance);
        
        markersRef.current.push(marker);
      }
      
      // Tracer une ligne simple entre les points
      mapInstance.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: [
              [validDeparture.lon, validDeparture.lat],
              [validDestination.lon, validDestination.lat]
            ]
          }
        }
      });
      
      mapInstance.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#0078d4',
          'line-width': 4,
          'line-opacity': 0.7
        }
      });
      
      // Ajuster la vue aux marqueurs
      const bounds = new maplibregl.LngLatBounds()
        .extend([validDeparture.lon, validDeparture.lat])
        .extend([validDestination.lon, validDestination.lat]);
        
      mapInstance.fitBounds(bounds, { padding: 50 });
    });

    // Nettoyage à la fin
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [departure, destination]);

  // Afficher un placeholder pendant le chargement
  if (!departure || !destination) {
    return (
      <div className="w-full h-60 bg-neutral-800/50 rounded flex items-center justify-center">
        <SectionLoading text="Chargement des données de trajet..." />
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="w-full h-60 map-container-minimal rounded-lg overflow-hidden"
    />
  );
}
