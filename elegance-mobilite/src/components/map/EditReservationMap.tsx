'use client';

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { Location } from '../../lib/types/map-types';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/styles/client-map.css'; // Utiliser les styles client pour cohérence
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

  // Force la création de la carte au démarrage, même si les coordonnées ne sont pas encore prêtes
  useEffect(() => {
    // Forcer le rendu initial de la carte même sans coordonnées
    const renderMap = () => {
      // Si la carte existe déjà, ne pas la recréer
      if (map.current) return;
      
      console.log("[EditMap] Forcer le rendu initial de la carte");
      
      if (!mapContainer.current) return;
      
      // Créer une carte avec Paris comme position par défaut
      const mapInstance = new maplibregl.Map({
        container: mapContainer.current as HTMLElement,
        style: {
          version: 8,
          // Ajouter la propriété glyphs requise pour text-field
          glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
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
        center: [2.3522, 48.8566] as [number, number], // Paris par défaut
        zoom: 10,
        attributionControl: false
      });
      
      mapInstance.on('load', () => {
        console.log("[EditMap] Carte initiale chargée");
        map.current = mapInstance;
        setMapReady(true);
      });
    };
    
    // Forcer le rendu initial
    renderMap();
    
    // Nettoyage
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Mise à jour de la carte quand les coordonnées changent
  useEffect(() => {
    // Valider les coordonnées
    if (!departure || !destination || !isValidLocation(departure) || !isValidLocation(destination) || !map.current || !mapReady) {
      return;
    }

    console.log("[EditMap] Mise à jour de la carte avec nouvelles coordonnées");
    
    // À ce stade, TypeScript sait que departure et destination sont valides
    const validDeparture = departure as Location;
    const validDestination = destination as Location;
    
    // Nettoyer les marqueurs existants
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Ajouter les nouveaux marqueurs
    if (map.current) {
      // Marqueur de départ
      const depEl = document.createElement('div');
      depEl.className = 'marker map-marker';
      depEl.style.backgroundColor = '#28a745';
      
      const depMarker = new maplibregl.Marker(depEl)
        .setLngLat([validDeparture.lon, validDeparture.lat])
        .addTo(map.current);
      
      markersRef.current.push(depMarker);
      
      // Marqueur de destination
      const destEl = document.createElement('div');
      destEl.className = 'marker map-marker';
      destEl.style.backgroundColor = '#dc3545';
      
      const destMarker = new maplibregl.Marker(destEl)
        .setLngLat([validDestination.lon, validDestination.lat])
        .addTo(map.current);
      
      markersRef.current.push(destMarker);
      
      // Mettre à jour ou créer la source pour la route
      try {
        let source = map.current.getSource('route') as maplibregl.GeoJSONSource;
        
        if (source) {
          // Mettre à jour la source existante
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
        } else {
          // Créer une nouvelle source et couche
          map.current.addSource('route', {
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
          
          map.current.addLayer({
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
        }
        
        // Ajuster la vue aux nouveaux points
        const bounds = new maplibregl.LngLatBounds()
          .extend([validDeparture.lon, validDeparture.lat])
          .extend([validDestination.lon, validDestination.lat]);
        
        map.current.fitBounds(bounds, { padding: 50 });
        
      } catch (e) {
        console.error("[EditMap] Erreur lors de la mise à jour de la route:", e);
      }
    }
  }, [departure, destination, mapReady]);

  // Hack pour forcer l'affichage de la carte après le montage initial
  useEffect(() => {
    // Force le rafraîchissement de la carte après le montage complet
    if (mapReady && map.current) {
      console.log("[EditMap] Force refresh après montage complet");
      
      // Attendre que tout soit bien monté et rendu
      const forceRefreshTimer = setTimeout(() => {
        if (!map.current) return;
        
        // Forcer un resize pour garantir que la carte est correctement dimensionnée
        map.current.resize();
        
        // Si on a des coordonnées valides, ajuster la vue
        if (departure && destination && 
            isValidLocation(departure) && isValidLocation(destination)) {
          try {
            const bounds = new maplibregl.LngLatBounds()
              .extend([departure.lon, departure.lat])
              .extend([destination.lon, destination.lat]);
            
            map.current.fitBounds(bounds, { padding: 50 });
          } catch (e) {
            console.error("Erreur lors de l'ajustement de la vue:", e);
          }
        }
      }, 500);
      
      return () => clearTimeout(forceRefreshTimer);
    }
  }, [mapReady, departure, destination]);

  // Afficher un placeholder pendant le chargement
  if (!mapReady || !departure || !destination) {
    return (
      <div className="w-full h-60 bg-neutral-800/50 rounded flex items-center justify-center">
        <SectionLoading text="Chargement de la carte..." />
      </div>
    );
  }

  return (
    <div
      ref={mapContainer}
      className="client-map-edit client-portal-map"
      style={{ height: '280px', visibility: 'visible', display: 'block' }}
    />
  );
}