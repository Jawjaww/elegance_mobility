// Interface de coordonnées standard - uniquement lon
export interface Coordinates {
  lat: number;
  lon: number; // Standardisé sur lon uniquement
}

// Interface de localisation complète (standardisée)
export interface Location {
  display_name: string;
  lat: number;
  lon: number; // Standardisé sur lon uniquement
  address?: any;
}

// Information d'itinéraire MapLibre
export interface RouteInfo {
  distance: number; // en mètres
  duration: number; // en secondes
  geometry: GeoJSON.LineString; // Format standard GeoJSON
}

// Réponse d'itinéraire
export interface RouteResponse {
  status: 'success' | 'error';
  route?: RouteInfo;
  error?: string;
}

// Propriétés du marqueur sur la carte
export interface MapMarkerProps {
  position: Coordinates;
  tooltip?: string;
  icon?: string;
  isDraggable?: boolean;
  onDragEnd?: (coords: Coordinates) => void;
}

// Convertisseurs pour MapLibre
export const toMapLibreLatLon = (coords: Coordinates): [number, number] => {
  return [coords.lon, coords.lat]; 
};

export const fromMapLibreLatLon = (lonLat: [number, number]): Coordinates => {
  return { lat: lonLat[1], lon: lonLat[0] };
};

// Adaptateur OpenStreetMap -> format standardisé (maintenant identique)
export const fromOsmFormat = (osmCoords: {lat: number, lon: number}): Coordinates => {
  return { lat: osmCoords.lat, lon: osmCoords.lon };
};

// Adaptateur format standardisé -> OpenStreetMap (maintenant identique)
export const toOsmFormat = (coords: Coordinates) => {
  return { lat: coords.lat, lon: coords.lon };
};

// Mise à jour des interfaces pour utiliser lon
export interface MapProps {
  startPoint?: Coordinates | null;
  endPoint?: Coordinates | null;
  enableRouting?: boolean;
  onRouteCalculated?: (distance: number, duration?: number) => void;
  origin?: Coordinates | null;
  destination?: Coordinates | null;
}

// Interface de marqueur standard
export interface MapMarker {
  position: [number, number];  // Format [lon, lat] pour MapLibre
  address?: string;
  color?: string;
  icon?: string;
  tooltip?: string;
  draggable?: boolean;
  onDragEnd?: (coords: Coordinates) => void;
}

export interface LocationSearchProps {
  onLocationSelect: (location: any) => void;
}
