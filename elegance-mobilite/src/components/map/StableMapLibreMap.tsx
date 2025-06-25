'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Database } from '@/lib/types/database.types';
import { cn } from '@/lib/utils';

// Type pour les données
type RideRow = Database["public"]["Tables"]["rides"]["Row"];

// Données de route et trajet
interface RouteData {
  polyline: string;
  distance: number;
  duration: number;
}

// Props avec options plus avancées
interface StableMapLibreMapProps {
  availableRides?: RideRow[];
  selectedRide?: RideRow | null;
  driverLocation?: [number, number];
  onRideSelect?: (ride: RideRow) => void;
  onRideAccept?: (ride: RideRow) => void;
  className?: string;
  isOnline?: boolean;
}

// Importation des types spécifiques
type MapLayer = maplibregl.StyleSpecification['layers'][0];

// Singleton pattern - Instance unique préservée en dehors du cycle de rendu React
let mapInstance: maplibregl.Map | null = null;
let initialized = false;
let markers: Record<string, maplibregl.Marker> = {};
let currentRoute: MapLayer | null = null;
let routeSource: maplibregl.GeoJSONSource | null = null;
let mapContainer: HTMLDivElement | null = null;
let mapInitializationAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

/**
 * Carte MapLibre GL JS optimisée qui évite les re-rendus et les problèmes WebGL
 * Cette implémentation préserve l'instance de carte entre les rendus React
 */

// Fonction pour nettoyer proprement les ressources de la carte
function cleanupMap() {
  // Nettoyer tous les marqueurs existants
  Object.values(markers).forEach(marker => {
    if (marker) marker.remove();
  });
  markers = {};
  
  // Nettoyer l'instance de carte mais sans la détruire complètement
  if (mapInstance) {
    // Sauvegarder les écouteurs d'événements essentiels avant de les supprimer
    try {
      // On ne supprime pas les écouteurs individuellement pour éviter les erreurs TypeScript
      // Mais on fait un nettoyage sélectif des éléments DOM
      
      // Préserver les écouteurs load et error
      
      // Nettoyer les contrôles visuellement (sans les supprimer)
      // pour éviter les problèmes de doublons
      if (mapInstance.getContainer()) {
        const controls = mapInstance.getContainer().querySelectorAll('.maplibregl-ctrl');
        if (controls.length > 2) {  // Si plus de 2 groupes de contrôles, supprimer les excédents
          console.log(`🧹 Nettoyage de ${controls.length - 2} contrôles excédentaires`);
          for (let i = 2; i < controls.length; i++) {
            controls[i].classList.add('maplibregl-ctrl-hidden');
          }
        }
      }
    } catch (e) {
      console.warn('Erreur lors du nettoyage des écouteurs:', e);
    }
    
    console.log('🧹 Nettoyage des ressources de la carte effectué');
  }
}

export default function StableMapLibreMap({
  availableRides = [],
  selectedRide = null,
  driverLocation,
  onRideSelect,
  onRideAccept,
  className = "w-full h-full",
  isOnline = false
}: StableMapLibreMapProps) {
  // Ref uniquement pour obtenir l'élément DOM
  const containerRef = useRef<HTMLDivElement>(null);
  
  // État local (n'affecte pas la carte, uniquement pour le UI)
  const [isMapReady, setIsMapReady] = useState(initialized);
  const [routeData, setRouteData] = useState<RouteData | null>(null);

  // INITIALISATION DE LA CARTE - UNE SEULE FOIS
  useEffect(() => {
    console.log('Checking map initialization status...');
    
    // Si la carte existe déjà et est attachée au DOM, ne rien faire
    if (initialized && mapInstance) {
      console.log('Map instance already exists:', mapInstance.getContainer().id);
      
      // Si le conteneur a changé, transférer la carte au nouveau conteneur
      if (containerRef.current && containerRef.current !== mapContainer) {
        console.log('Transferring map to new container');
        mapContainer = containerRef.current;
        mapInstance.resize();
      }
      
      return;
    }

    // Initialisation si nécessaire
    if (containerRef.current) {
      console.log('Initializing MapLibre (ONE TIME ONLY)');
      mapContainer = containerRef.current;
      
      try {
        // Avant de créer une nouvelle instance, vérifier si l'ancienne a encore des problèmes
        if (mapInitializationAttempts > 0 && mapInitializationAttempts < MAX_INIT_ATTEMPTS) {
          console.warn(`🔄 Tentative de réinitialisation de la carte (${mapInitializationAttempts}/${MAX_INIT_ATTEMPTS})`);
        }
        
        // Nettoyer proprement avant de créer une nouvelle instance
        cleanupMap();
        
        // Incrémenter le compteur de tentatives
        mapInitializationAttempts++;
        
        // Création de la carte avec plus d'options de robustesse
        mapInstance = new maplibregl.Map({
          container: containerRef.current,
          style: {
            version: 8,
            sources: {
              'osm-tiles': {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap Contributors'
              }
            },
            layers: [
              {
                id: 'osm-tiles',
                type: 'raster',
                source: 'osm-tiles',
                minzoom: 0,
                maxzoom: 19
              }
            ]
          },
          center: [2.3522, 48.8566], // Paris
          zoom: 13,
          attributionControl: false,
          maxBounds: [[-20, 20], [55, 80]], // Limites raisonnables pour l'Europe
        });
        
        mapInstance.on('load', () => {
          console.log('✅ MapLibre loaded successfully');
          
          // Ajouter la source de données pour les routes - avec vérification
          try {
            // Vérifier si la source existe déjà (après hot reload par exemple)
            if (!mapInstance?.getSource('route')) {
              console.log('✨ Ajout de la source route (nouveau)');
              mapInstance?.addSource('route', {
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
            } else {
              console.log('♻️ Source route existante réutilisée');
            }
            
            routeSource = mapInstance?.getSource('route') as maplibregl.GeoJSONSource;
          } catch (error) {
            console.error('❌ Erreur lors de l\'ajout de la source:', error);
          }
          
          // Ajouter la couche pour les routes - avec vérification
          try {
            // Vérifier si la couche existe déjà (après hot reload par exemple)
            if (!mapInstance?.getLayer('route-line')) {
              console.log('✨ Ajout de la couche route-line (nouveau)');
              mapInstance?.addLayer({
                id: 'route-line',
                type: 'line',
                source: 'route',
                layout: {
                  'line-join': 'round',
                  'line-cap': 'round'
                },
                paint: {
                  'line-color': '#4a89dc',
                  'line-width': 4,
                  'line-opacity': 0.8
                }
              });
            } else {
              console.log('♻️ Couche route-line existante réutilisée');
            }
          } catch (error) {
            console.error('❌ Erreur lors de l\'ajout de la couche:', error);
          }
          
          // Vérifier si les contrôles sont déjà ajoutés avant d'en ajouter de nouveaux
          // Pour cela, on inspecte les éléments DOM pour voir si les contrôles existent déjà
          const mapContainer = mapInstance?.getContainer();
          const existingControls = mapContainer ? mapContainer.querySelectorAll('.maplibregl-ctrl-group') : [];
          
          if (!existingControls || existingControls.length === 0) {
            console.log('✨ Ajout des contrôles de carte');
            
            // Ajouter les contrôles minimalistes en bas à droite avec une marge suffisante du bottom sheet
            mapInstance?.addControl(
              new maplibregl.NavigationControl({ 
                showCompass: false,
                visualizePitch: false
              }), 
              'bottom-right'
            );
            
            // Géolocalisation discrète en bas à droite
            mapInstance?.addControl(
              new maplibregl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: true,
                showAccuracyCircle: true,
                showUserLocation: true
              }),
              'bottom-right'
            );
          } else {
            console.log('♻️ Contrôles de carte existants réutilisés');
          }
          
          initialized = true;
          setIsMapReady(true);
        });

        // Gérer les erreurs WebGL spécifiquement
        mapInstance.on('error', (e) => {
          console.error('MapLibre error:', e);
          if (e.error && e.error.message && e.error.message.includes('WebGL')) {
            console.warn('WebGL error detected, attempting to recover...');
            // Ne pas détruire complètement la carte, seulement détacher
            if (mapContainer && mapContainer.contains(mapInstance!.getContainer())) {
              mapContainer.removeChild(mapInstance!.getContainer());
            }
          }
        });
        
      } catch (error) {
        console.error('❌ MapLibre initialization failed:', error);
      }
    }

    // Cleanup function - détacher plutôt que détruire
    return () => {
      // NE PAS DETRUIRE LA CARTE - juste détacher du DOM si nécessaire
      // Cela est crucial pour éviter la perte de contexte WebGL
      if (mapInstance && containerRef.current) {
        console.log('Detaching map (not destroying)');
        
        // Nettoyage minimal pour éviter les fuites mémoire
        cleanupMap();
      }
    };
  }, []); // IMPORTANT: pas de dépendances = pas de re-render

  // GESTION DES MARKERS - mise à jour sans réinitialiser la carte
  useEffect(() => {
    if (!mapInstance || !initialized || !isMapReady) return;
    
    console.log(`Updating ${availableRides.length} markers without re-rendering map`);
    
    // Vider les markers qui n'existent plus
    Object.keys(markers).forEach(id => {
      if (!availableRides.some(ride => ride.id === id)) {
        console.log(`Removing marker for ride ${id}`);
        markers[id].remove();
        delete markers[id];
      }
    });
    
    // Ajouter ou mettre à jour les markers existants
    availableRides.forEach(ride => {
      if (!ride.pickup_lat || !ride.pickup_lon) return;
      
      const coords: [number, number] = [ride.pickup_lon, ride.pickup_lat];
      
      if (!markers[ride.id]) {
        // Créer un élément DOM pour le marker
        const el = document.createElement('div');
        el.className = 'ride-marker';
        el.innerHTML = `
          <div class="relative">
            <div class="absolute -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center shadow-lg border-2 border-white transform hover:scale-110 transition-all duration-200 cursor-pointer">
              🚗
            </div>
            <div class="absolute top-0 left-0 w-2 h-2 bg-blue-300 rounded-full animate-ping"></div>
          </div>
        `;
        
        // Créer le marker et l'ajouter à la carte
        const marker = new maplibregl.Marker(el)
          .setLngLat(coords)
          .addTo(mapInstance!);
        
        // Ajouter un event listener pour la sélection
        el.addEventListener('click', () => {
          console.log('Marker clicked:', ride.id);
          if (onRideSelect) onRideSelect(ride);
        });
        
        // Stocker le marker
        markers[ride.id] = marker;
      } else {
        // Mettre à jour le marker existant
        markers[ride.id].setLngLat(coords);
      }
    });
  }, [availableRides, onRideSelect, isMapReady]);

  // GESTION DE LA COURSE SÉLECTIONNÉE
  useEffect(() => {
    if (!mapInstance || !initialized || !isMapReady) return;
    
    if (selectedRide && selectedRide.pickup_lat && selectedRide.pickup_lon && 
        selectedRide.dropoff_lat && selectedRide.dropoff_lon) {
      console.log('Showing selected ride:', selectedRide.id);
      
      try {
        // Centrer la carte sur le point de départ
        mapInstance.flyTo({
          center: [selectedRide.pickup_lon, selectedRide.pickup_lat],
          zoom: 14,
          essential: true
        });
        
        // Créer les coordonnées pour le trajet
        const routeCoordinates = [
          [selectedRide.pickup_lon, selectedRide.pickup_lat],
          [selectedRide.dropoff_lon, selectedRide.dropoff_lat]
        ];
        
        // Mettre à jour la source de données
        if (routeSource) {
          // Vérifier que routeSource et setData sont disponibles
          if (typeof routeSource.setData === 'function') {
            routeSource.setData({
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: routeCoordinates
              }
            });
          } else {
            console.warn('⚠️ routeSource.setData n\'est pas une fonction');
            
            // Recréer la source si elle n'est pas utilisable
            if (mapInstance.getSource('route')) {
              mapInstance.removeSource('route');
            }
            
            mapInstance.addSource('route', {
              type: 'geojson',
              data: {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: routeCoordinates
                }
              }
            });
            
            routeSource = mapInstance.getSource('route') as maplibregl.GeoJSONSource;
          }
        } else {
          console.warn('⚠️ routeSource est undefined');
        }
      } catch (error) {
        console.error('❌ Erreur lors de la mise à jour du trajet:', error);
      }
      
      // Calculer la distance approximative
      const distance = calculateDistance(
        [selectedRide.pickup_lat, selectedRide.pickup_lon],
        [selectedRide.dropoff_lat, selectedRide.dropoff_lon]
      );
      
      setRouteData({
        polyline: 'dummy-polyline',
        distance: distance,
        duration: Math.round(distance / 35 * 60) // ~35 km/h en ville
      });
    } else if (routeSource) {
      // Nettoyer la route si pas de course sélectionnée
      routeSource.setData({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: []
        }
      });
      setRouteData(null);
    }
  }, [selectedRide, isMapReady]);

  // Calcule la distance en km entre deux points
  const calculateDistance = (point1: [number, number], point2: [number, number]): number => {
    // Formule de Haversine
    const R = 6371; // Rayon de la terre en km
    const dLat = (point2[0] - point1[0]) * Math.PI / 180;
    const dLon = (point2[1] - point1[1]) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(point1[0] * Math.PI / 180) * Math.cos(point2[0] * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance en km
  };

  return (
    <div className={className}>
      <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}></div>
      
      {/* Indicateur de courses disponibles uniquement - n'afficher que s'il y a des courses */}
      {availableRides.length > 0 && (
        <div className="absolute top-4 left-4 z-10 bg-neutral-900/70 backdrop-blur-sm text-white text-sm py-2 px-3 rounded-lg flex items-center">
          <span className="font-medium">{availableRides.length} course{availableRides.length > 1 ? 's' : ''} disponible{availableRides.length > 1 ? 's' : ''}</span>
        </div>
      )}
      
      {/* Carte de course flottante - quand une course est sélectionnée */}
      {selectedRide && (
        <div className="absolute left-4 right-4 bottom-24 z-20">
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl overflow-hidden border border-gray-200 max-w-md mx-auto">
            <div className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg text-gray-800">
                    Course #{selectedRide.id.slice(-6)}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedRide.pickup_time || selectedRide.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                  {selectedRide.vehicle_type || 'Standard'}
                </div>
              </div>
              
              <div className="space-y-3 mb-4">
                <div className="flex gap-3">
                  <div className="mt-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{selectedRide.pickup_address}</p>
                    <p className="text-xs text-gray-500">Point de départ</p>
                  </div>
                </div>
                
                {routeData && (
                  <div className="flex items-center text-xs text-gray-500 pl-1.5">
                    <span>~{routeData.distance.toFixed(1)} km</span>
                    <span>•</span>
                    <span>~{Math.round(routeData.duration)} min</span>
                  </div>
                )}
                
                <div className="flex gap-3">
                  <div className="mt-1">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  </div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{selectedRide.dropoff_address}</p>
                    <p className="text-xs text-gray-500">Destination</p>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button 
                  className="flex-1 py-2.5 px-3 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm"
                  onClick={() => {
                    if (onRideSelect) onRideSelect(null as any);
                  }}
                >
                  Fermer
                </button>
                {onRideAccept && (
                  <button 
                    className="flex-1 py-2.5 px-3 rounded-lg bg-green-600 text-white font-medium text-sm"
                    onClick={() => {
                      if (onRideAccept) onRideAccept(selectedRide);
                    }}
                  >
                    Accepter la course
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {!isMapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Ajout d'un peu de CSS pour les markers
const style = document.createElement('style');
style.textContent = `
.ride-marker {
  width: 0;
  height: 0;
}
`;
document.head.appendChild(style);
