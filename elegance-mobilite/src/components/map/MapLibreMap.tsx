'use client';

import { useEffect, useRef, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import { Location } from '../../lib/types/map-types';
import 'maplibre-gl/dist/maplibre-gl.css';
import '@/styles/map.css';

// Compteur global de cartes actives et singleton de gestion
let activeMapInstances = 0;
const MAX_ACTIVE_MAPS = 1; // Limité à une seule carte active à la fois
const FORCE_CLEANUP_TIMEOUT = 500; // 500ms pour nettoyer forcement

// Registre global unique pour toutes les instances de carte actives
class MapRegistry {
  private static instance: MapRegistry;
  private registry = new Map<string, { map: maplibregl.Map, timestamp: number }>();
  
  private constructor() {}
  
  public static getInstance(): MapRegistry {
    if (!MapRegistry.instance) {
      MapRegistry.instance = new MapRegistry();
    }
    return MapRegistry.instance;
  }
  
  public register(id: string, map: maplibregl.Map): void {
    this.registry.set(id, { map, timestamp: Date.now() });
    console.log(`[MapRegistry] Carte ${id} enregistrée. Total: ${this.registry.size}`);
  }
  
  public unregister(id: string): void {
    if (this.registry.has(id)) {
      this.registry.delete(id);
      console.log(`[MapRegistry] Carte ${id} désenregistrée. Total: ${this.registry.size}`);
    }
  }
  
  public forceCleanupOldest(): void {
    if (this.registry.size <= MAX_ACTIVE_MAPS) return;
    
    // Obtenir et trier les instances par timestamp
    const instances = Array.from(this.registry.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
    // Ne garder que la plus récente
    const toRemove = instances.slice(0, instances.length - MAX_ACTIVE_MAPS);
    
    toRemove.forEach(([id, entry]) => {
      console.log(`[MapRegistry] Nettoyage forcé de la carte ${id}`);
      try {
        if (entry.map) {
          // Supprimer tous les marqueurs
          const markers = entry.map.getContainer().querySelectorAll('.maplibregl-marker');
          markers.forEach((m) => m.remove());
          
          // Supprimer les sources et couches
          try {
            if (entry.map.getSource('route')) {
              if (entry.map.getLayer('route-line')) {
                entry.map.removeLayer('route-line');
              }
              entry.map.removeSource('route');
            }
          } catch (e) {
            console.warn(`[MapRegistry] Erreur dans le nettoyage de la carte ${id}:`, e);
          }
          
          // Supprimer la carte
          entry.map.remove();
        }
        
        this.unregister(id);
        activeMapInstances = Math.max(0, activeMapInstances - 1);
      } catch (e) {
        console.error(`[MapRegistry] Erreur critique lors du nettoyage de la carte ${id}:`, e);
      }
    });
  }
  
  public cleanup(): void {
    this.registry.forEach((entry, id) => {
      try {
        if (entry.map) {
          entry.map.remove();
        }
        this.registry.delete(id);
      } catch (e) {
        console.warn(`[MapRegistry] Erreur lors du nettoyage complet, carte ${id}:`, e);
      }
    });
    
    // Réinitialiser complètement
    this.registry.clear();
    activeMapInstances = 0;
  }
  
  public getSize(): number {
    return this.registry.size;
  }

  public ensureSingleInstance(currentId: string): void {
    // Si nous n'avons qu'une seule instance active qui est l'actuelle, ne rien faire
    if (this.registry.size <= 1 && this.registry.has(currentId)) {
      return;
    }
    
    // Sinon, supprimer toutes les autres instances
    this.registry.forEach((entry, id) => {
      if (id !== currentId) {
        console.log(`[MapRegistry] Nettoyage de l'instance ${id} pour garder uniquement ${currentId}`);
        try {
          if (entry.map) {
            // Supprimer les marqueurs
            const markers = entry.map.getContainer().querySelectorAll('.maplibregl-marker');
            markers.forEach((m) => m.remove());
            
            // Supprimer les sources et couches
            try {
              if (entry.map.getSource('route')) {
                if (entry.map.getLayer('route-line')) {
                  entry.map.removeLayer('route-line');
                }
                entry.map.removeSource('route');
              }
            } catch (e) {
              console.warn(`[MapRegistry] Erreur dans le nettoyage de la carte ${id}:`, e);
            }
            
            // Supprimer la carte
            entry.map.remove();
          }
          
          this.unregister(id);
          activeMapInstances = Math.max(0, activeMapInstances - 1);
        } catch (e) {
          console.error(`[MapRegistry] Erreur critique lors du nettoyage de la carte ${id}:`, e);
        }
      }
    });
  }
}

const mapRegistry = MapRegistry.getInstance();

// Force global cleanup on window unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    mapRegistry.cleanup();
  });
}

interface MapLibreMapProps {
  departure: Location | null;
  destination: Location | null;
  onRouteCalculated?: (distance: number, duration: number) => void;
  enableRouting?: boolean; // Nouveau prop pour contrôler si on trace l'itinéraire
}

interface MarkerOptions {
  color: string;
  size?: number;
  pulse?: boolean;
}

export default function MapLibreMap({ 
  departure, 
  destination, 
  onRouteCalculated,
  enableRouting = true // Par défaut, on trace l'itinéraire si les deux points sont présents
}: MapLibreMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [styleLoaded, setStyleLoaded] = useState(false);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const routeAttemptRef = useRef(false);
  const pointsRef = useRef<{dep: Location | null, dest: Location | null}>({dep: null, dest: null});
  const retryCountRef = useRef(0);
  const MAX_RETRIES = 5;
  const isMountedRef = useRef(true);
  const uniqueMarkersRef = useRef(new Map<string, maplibregl.Marker>());
  // Référence pour suivre si la route a déjà été tracée pour éviter les appels répétés
  const routeTracedRef = useRef<string | null>(null);
  
  // ID unique pour cette instance de carte
  const mapInstanceIdRef = useRef(`map-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);

  // Fonction utilitaire pour valider un objet Location
  const isValidLocation = (loc: Location | null): loc is Location => {
    try {
      if (!loc || typeof loc !== 'object') return false;

      const lat = Number(loc.lat);
      const lon = Number(loc.lon);

      return (
        !isNaN(lat) && 
        !isNaN(lon) && 
        lat >= -90 && 
        lat <= 90 && 
        lon >= -180 && 
        lon <= 180
      );
    } catch (e) {
      console.warn("[MapLibre] Erreur de validation des coordonnées:", e);
      return false;
    }
  };
  
  // Fonction pour créer/mettre à jour un marqueur de manière unique avec améliorations
  const createOrUpdateMarker = useCallback((location: Location, options: MarkerOptions): maplibregl.Marker => {
    if (!map.current) throw new Error("Map not initialized");
    
    // Créer une clé unique basée sur les coordonnées
    const key = `${location.lat},${location.lon}-${options.color}`;
    
    // Vérifier si un marqueur existe déjà à cette position
    if (uniqueMarkersRef.current.has(key)) {
      return uniqueMarkersRef.current.get(key)!;
    }
    
    // Créer un élément de marqueur amélioré
    const el = document.createElement('div');
    el.className = 'map-marker-container';
    
    // Structure HTML améliorée pour le marqueur
    el.innerHTML = `
      <div class="map-marker ${options.pulse ? 'map-marker-pulse' : ''}" 
           style="background-color:${options.color}">
        <div class="map-marker-icon">
          ${options.color === '#28a745' ? 
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>' : 
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="16" height="16"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
          }
        </div>
      </div>
      <div class="map-marker-shadow"></div>
    `;
    
    // Style utilisé au lieu de CSS externe pour assurer la portabilité
    const style = document.createElement('style');
    style.textContent = `
      .map-marker-container {
        position: relative;
      }
      .map-marker {
        width: ${options.size || 24}px;
        height: ${options.size || 24}px;
        border-radius: 50% 50% 50% 0;
        background: ${options.color};
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 10px rgba(0,0,0,0.3);
      }
      .map-marker-icon {
        transform: rotate(45deg);
      }
      .map-marker-shadow {
        width: ${(options.size || 24) * 0.8}px;
        height: ${(options.size || 24) * 0.3}px;
        background: rgba(0,0,0,0.2);
        border-radius: 50%;
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
      }
      .map-marker-pulse {
        animation: pulse 1.5s infinite;
      }
      @keyframes pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(${options.color === '#28a745' ? '40,167,69' : '220,53,69'},0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(${options.color === '#28a745' ? '40,167,69' : '220,53,69'},0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(${options.color === '#28a745' ? '40,167,69' : '220,53,69'},0);
        }
      }
    `;
    el.appendChild(style);
    
    // Créer le popup avec l'adresse
    const popup = new maplibregl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 25,
      className: 'map-custom-popup'
    }).setHTML(`
      <div class="map-popup-content">
        <strong>${options.color === '#28a745' ? 'Départ' : 'Destination'}</strong>
        <p>${location.display_name}</p>
      </div>
    `);

    // Créer le marqueur avec le popup
    const marker = new maplibregl.Marker(el)
      .setLngLat([location.lon, location.lat])
      .setPopup(popup)
      .addTo(map.current);
    
    // Ajouter des interactions
    el.addEventListener('mouseenter', () => marker.togglePopup());
    el.addEventListener('mouseleave', () => marker.togglePopup());
    
    // Stocker le marqueur pour référence future
    uniqueMarkersRef.current.set(key, marker);
    markersRef.current.push(marker);
    
    return marker;
  }, []);

  // Force le nettoyage des cartes existantes avant de monter une nouvelle
  useEffect(() => {
    // Force cleanup of old instances
    mapRegistry.forceCleanupOldest();
    
    // Cleanup GL contexts
    const canvases = document.querySelectorAll('.maplibregl-canvas');
    canvases.forEach((canvas, index) => {
      try {
        if (index < canvases.length - 1) { // Laisser la plus récente
          const gl = (canvas as HTMLCanvasElement).getContext('webgl');
          if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext();
        }
      } catch (e) {
        console.warn("Impossible de nettoyer le contexte WebGL:", e);
      }
    });
  }, []);

  // Fonction pour nettoyer la carte et libérer les ressources
  const cleanupMap = useCallback(() => {
    if (map.current) {
      console.log(`[MapLibre ${mapInstanceIdRef.current}] Nettoyage de la carte`);
      
      // Désinscrire la carte du registre
      mapRegistry.unregister(mapInstanceIdRef.current);
      
      // Nettoyage explicite des sources et des couches
      try {
        if (map.current.getSource('route')) {
          if (map.current.getLayer('route-line')) {
            map.current.removeLayer('route-line');
          }
          map.current.removeSource('route');
        }
      } catch (e) {
        console.warn(`[MapLibre] Erreur lors du nettoyage des sources: ${e}`);
      }
      
      // Nettoyer les marqueurs de manière plus exhaustive
      markersRef.current.forEach(marker => {
        try { marker.remove(); } catch (e) {}
      });
      markersRef.current = [];
      uniqueMarkersRef.current.clear();
      
      try {
        // Supprimer la carte et réduire le compteur global
        map.current.remove();
      } catch (e) {
        console.error(`[MapLibre] Erreur lors de la suppression de la carte: ${e}`);
      }
      
      map.current = null;
      activeMapInstances = Math.max(0, activeMapInstances - 1);
      console.log(`[MapLibre] Carte nettoyée. Instances actives: ${activeMapInstances}`);
      
      // Réinitialiser les états
      setMapLoaded(false);
      setStyleLoaded(false);
    }
  }, [mapInstanceIdRef]);

  // Fonction pour nettoyer et ajouter des marqueurs
  const updateMarkers = useCallback(() => {
    if (!map.current) return;

    try {
      // Ajouter les nouveaux marqueurs si les coordonnées sont disponibles
      if (isValidLocation(departure)) {
        createOrUpdateMarker(departure, {
          color: '#28a745',
          size: 20
        });
      }

      if (isValidLocation(destination)) {
        createOrUpdateMarker(destination, {
          color: '#dc3545',
          size: 20
        });
      }
    } catch (e) {
      console.error("Erreur lors de la mise à jour des marqueurs:", e);
    }
  }, [departure, destination, createOrUpdateMarker]);

  // Fonction pour calculer et afficher l'itinéraire
  const fetchAndDisplayRoute = useCallback(async (dep: Location, dest: Location) => {
    if (!map.current || !styleLoaded || !enableRouting) return;
    
    // Valider les coordonnées
    if (!dep?.lat || !dep?.lon || !dest?.lat || !dest?.lon || 
        isNaN(dep.lat) || isNaN(dep.lon) || isNaN(dest.lat) || isNaN(dest.lon)) {
      console.warn("[MapLibre] Coordonnées invalides:", { dep, dest });
      return;
    }
    
    // Créer une clé unique pour cette route
    const routeKey = `${dep.lat},${dep.lon}-${dest.lat}`;
    
    // Si cette route a déjà été tracée, éviter de la retracer
    if (routeTracedRef.current === routeKey) {
      return;
    }

    try {
      // Format précis pour l'API
      const startCoord = `${dep.lon.toFixed(6)},${dep.lat.toFixed(6)}`;
      const endCoord = `${dest.lon.toFixed(6)},${dest.lat.toFixed(6)}`;
      const url = `/api/directions?start=${startCoord}&end=${endCoord}`;
      
      console.log("[MapLibre] Requête route:", { start: startCoord, end: endCoord });
      const response = await fetch(url);

      if (!isMountedRef.current) return;
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);

      const data = await response.json();
      if (!isMountedRef.current) return;
      
      if (data.features && data.features.length > 0) {
        const route = data.features[0];
        const coordinates = route.geometry.coordinates;
        const distance = route.properties.summary.distance;
        const duration = route.properties.summary.duration;
        
        if (map.current && styleLoaded) {
          try {
            const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
            if (source) {
              source.setData({
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates
                }
              });
              
              // Ajuster la vue pour montrer l'itinéraire
              if (coordinates && coordinates.length > 1) {
                const bounds = new maplibregl.LngLatBounds();
                coordinates.forEach((coord: [number, number]) => {
                  bounds.extend(coord);
                });
                
                // Ajouter un padding pour que les marqueurs soient bien visibles
                map.current.fitBounds(bounds, {
                  padding: 60, // Augmenté pour éviter que les marqueurs soient coupés
                  maxZoom: 15
                });
                
                // Marquer cette route comme tracée pour éviter la boucle
                routeTracedRef.current = routeKey;
                console.log("[MapLibre] Tracé de route affiché avec succès");
              }
              
              // Informer le composant parent des détails de l'itinéraire (une seule fois)
              if (onRouteCalculated) {
                onRouteCalculated(distance, duration);
              }
            }
          } catch (error) {
            console.error("[MapLibre] Erreur lors de la mise à jour de la source:", error);
          }
        }
      }
    } catch (error) {
      console.error("[MapLibre] Erreur lors de la récupération de l'itinéraire:", error);
    }
  }, [styleLoaded, onRouteCalculated, enableRouting]);

  // Gérer les mises à jour des points et du tracé - MODIFIÉ pour éviter la boucle
  useEffect(() => {
    if (!mapLoaded || !styleLoaded || !map.current) {
      if (isValidLocation(departure) && isValidLocation(destination) && enableRouting) {
        routeAttemptRef.current = true;
        console.log(`[MapLibre ${mapInstanceIdRef.current}] Points mis à jour, mais carte pas prête - on attendra`);
      }
      return;
    }

    // Créer une clé unique pour cette combinaison de points
    const routeKey = isValidLocation(departure) && isValidLocation(destination) 
      ? `${departure.lat},${departure.lon}-${destination.lat}`
      : null;
    
    // Mise à jour des marqueurs (toujours exécutée)
    updateMarkers();
    
    // Centrer la carte sur le point unique si un seul est présent
    if (isValidLocation(departure) && !destination) {
      map.current.flyTo({
        center: [departure.lon, departure.lat],
        zoom: 14
      });
    } else if (!departure && isValidLocation(destination)) {
      map.current.flyTo({
        center: [destination.lon, destination.lat],
        zoom: 14
      });
    }
    
    // Vérifier si on peut tracer une route ET si elle n'a pas déjà été tracée
    if (isValidLocation(departure) && isValidLocation(destination) && enableRouting) {
      const routeKey = `${departure.lat},${departure.lon}-${destination.lat},${destination.lon}`;
      if (routeKey !== routeTracedRef.current) {
        console.log(`[MapLibre ${mapInstanceIdRef.current}] Points mis à jour, tentative de tracé`);
        pointsRef.current = {dep: departure, dest: destination};
        retryCountRef.current = 0;
        fetchAndDisplayRoute(departure, destination);
      }
    }
    // Si l'un des points manque mais qu'une route était tracée, effacer la route
    else if (routeTracedRef.current) {
      try {
        const source = map.current.getSource('route') as maplibregl.GeoJSONSource;
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
            }
          });
          routeTracedRef.current = null;
        }
      } catch (error) {
        console.error("[MapLibre] Erreur lors de l'effacement du tracé:", error);
      }
    }
  }, [departure, destination, mapLoaded, styleLoaded, updateMarkers, fetchAndDisplayRoute, enableRouting]);

  // Effet de nettoyage au démontage du composant
  useEffect(() => {
    // Reset au montage
    routeTracedRef.current = null;
    isMountedRef.current = true;
    
    // Nettoyage au démontage ou après un timeout
    const cleanupTimeout = setTimeout(() => {
      if (map.current) {
        console.log(`[MapLibre ${mapInstanceIdRef.current}] Force cleanup après timeout`);
        cleanupMap();
      }
    }, 60000); // 1 minute de délai maximum
    
    return () => {
      isMountedRef.current = false;
      clearTimeout(cleanupTimeout);
      cleanupMap();
      
      // Nettoyer les éléments orphelins
      setTimeout(() => {
        document.querySelectorAll('.map-marker-orphaned').forEach(el => {
          el.remove();
        });
      }, FORCE_CLEANUP_TIMEOUT);
    };
  }, [cleanupMap]);

  // Effet pour assurer que les instances sont nettoyées en quittant la page
  useEffect(() => {
    return () => {
      // Assurons-nous de bien libérer les ressources
      if (map.current) {
        cleanupMap();
      }
      
      // Force le nettoyage du DOM pour supprimer les éléments orphelins
      const orphanedMarkers = document.querySelectorAll('.map-marker-orphaned');
      orphanedMarkers.forEach(marker => marker.remove());
    };
  }, [cleanupMap]);

  // Fonction utilitaire pour nettoyer les anciennes instances
  const cleanOldInstances = useCallback(() => {
    // Ne garder que les cartes les plus récentes
    if (mapRegistry.getSize() >= MAX_ACTIVE_MAPS) {
      mapRegistry.forceCleanupOldest();
    }
  }, []);

  // Ajouter une référence pour indiquer si la carte est complètement chargée
  const fullyLoadedRef = useRef(false);

  // Initialiser la carte
  useEffect(() => {
    // Vérifier si on peut créer une nouvelle carte
    if (!mapContainer.current || map.current) return;
    
    // Si aucun point n'est défini, ne pas créer de carte
    if (!departure && !destination) return;
    
    // Nettoyer les instances orphelines ou trop nombreuses
    cleanOldInstances();
    
    // Limiter le nombre de cartes actives
    if (activeMapInstances >= MAX_ACTIVE_MAPS) {
      console.warn(`[MapLibre] Trop de cartes actives (${activeMapInstances}). Nettoyage forcé...`);
      // Forcer le nettoyage de toutes les instances sauf une
      const allCanvases = document.querySelectorAll('.maplibregl-canvas');
      allCanvases.forEach((canvas, index) => {
        // Garder la dernière pour éviter les flashs
        if (index < allCanvases.length - 1) {
          try {
            const gl = (canvas as HTMLCanvasElement).getContext('webgl');
            if (gl) gl.getExtension('WEBGL_lose_context')?.loseContext();
          } catch (e) {
            console.warn("Impossible de nettoyer le contexte WebGL:", e);
          }
        }
      });
      
      // Forcer la libération des marqueurs orphelins
      document.querySelectorAll('.maplibregl-marker').forEach(el => {
        el.classList.add('map-marker-orphaned');
        setTimeout(() => el.remove(), 100);
      });
      
      activeMapInstances = 1; // Reset le compteur forcément
    }
    
    activeMapInstances++;
    console.log(`[MapLibre ${mapInstanceIdRef.current}] Initialisation (Instances actives: ${activeMapInstances})`);

    // Configuration du style de la carte
    const mapStyle: maplibregl.StyleSpecification = {
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
    };

    // Déterminer le centre initial de la carte
    const initialCenter: [number, number] = 
      isValidLocation(departure) ? [departure.lon, departure.lat] : 
      isValidLocation(destination) ? [destination.lon, destination.lat] : 
      [2.3488, 48.8534]; // Paris par défaut

    // Configuration de la carte
    const mapConfig: maplibregl.MapOptions = {
      container: mapContainer.current,
      style: mapStyle,
      center: initialCenter,
      zoom: 12,
      attributionControl: false,
      maxZoom: 18
    };

    // Créer la carte avec la configuration standard
    const mapInstance = new maplibregl.Map(mapConfig);

    // Écouter les événements d'erreur
    mapInstance.on('error', (e) => {
      console.error(`[MapLibre ${mapInstanceIdRef.current}] Erreur:`, e);
    });

    mapInstance.on('load', () => {
      if (!isMountedRef.current) {
        mapInstance.remove();
        activeMapInstances--;
        return;
      }
      
      console.log(`[MapLibre ${mapInstanceIdRef.current}] Carte chargée avec succès`);
      map.current = mapInstance;
      setMapLoaded(true);
      
      // Marquer la carte comme complètement chargée pour éviter le nettoyage
      fullyLoadedRef.current = true;
      
      try {
        // Ajouter la source et la couche pour la route
        mapInstance.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: []
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
            'line-width': 6,
            'line-opacity': 0.8
          }
        });

        // Attendons explicitement le chargement complet du style
        const waitForStyleLoad = () => {
          if (mapInstance.isStyleLoaded()) {
            console.log(`[MapLibre ${mapInstanceIdRef.current}] Style chargé`);
            setStyleLoaded(true);
            
            // Vérifier si on doit tracer une route avec un léger délai
            const { dep, dest } = pointsRef.current;
            if (routeAttemptRef.current && isValidLocation(dep) && isValidLocation(dest)) {
              setTimeout(() => {
                if (isMountedRef.current && map.current) {
                  fetchAndDisplayRoute(dep, dest);
                }
              }, 300);
            }
          } else {
            // Réessayer après un court délai
            setTimeout(waitForStyleLoad, 100);
          }
        };
        
        waitForStyleLoad();
      } catch (e) {
        console.warn(`[MapLibre ${mapInstanceIdRef.current}] Erreur lors de l'initialisation:`, e);
      }
      
      // Ajouter cette instance au registre global
      mapRegistry.register(mapInstanceIdRef.current, mapInstance);
      
      // S'assurer que c'est la seule carte active
      mapRegistry.ensureSingleInstance(mapInstanceIdRef.current);
    });

    // Force cleanup si jamais la carte ne se charge pas correctement
    const timeoutId = setTimeout(() => {
      // Éviter de nettoyer une carte correctement chargée
      if (!fullyLoadedRef.current && mapInstance) {
        console.warn(`[MapLibre ${mapInstanceIdRef.current}] Carte non chargée après délai, nettoyage forcé`);
        try {
          mapInstance.remove();
          activeMapInstances = Math.max(0, activeMapInstances - 1);
        } catch (e) {
          console.error("Erreur lors du nettoyage forcé:", e);
        }
      }
    }, 10000); // 10 secondes

    return () => {
      clearTimeout(timeoutId);
      if (!fullyLoadedRef.current && mapInstance) {
        try {
          mapInstance.remove();
          activeMapInstances = Math.max(0, activeMapInstances - 1);
        } catch (e) {}
      }
    };
  }, [departure, destination, cleanupMap, cleanOldInstances]);

  // Ajout d'une classe distinctive pour identifier l'instance de carte
  return (
    <div
      ref={mapContainer}
      className={`w-full h-full map-container map-instance-${mapInstanceIdRef.current}`}
      data-testid="map-container"
      style={{ margin: 0, padding: 0, border: 'none', outline: 'none' }}
    />
  );
}
