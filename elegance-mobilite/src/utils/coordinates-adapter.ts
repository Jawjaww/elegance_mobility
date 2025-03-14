import { Coordinates, CoordinatesAdapter } from "@/lib/types/types";

/**
 * Convertit les coordonnées GPS entre les différents formats utilisés dans l'application
 * Standardise sur le format 'lon' plutôt que 'lon'
 */

// Convertit de {lat, lon} vers {lat, lon}
export function toLonFormat(coords: { lat: number; lon: number }): Coordinates {
  return {
    lat: coords.lat,
    lon: coords.lon
  };
}

// Fonction helper pour créer un objet Coordinates valide
export function createCoordinates(lat: number, lon: number): Coordinates {
  return { lat, lon };
}

// Adapter flexible qui standardise toujours sur lon
export function adaptCoordinates(coords: CoordinatesAdapter): Coordinates {
  if (!coords) {
    throw new Error("Invalid coordinates provided");
  }
  
  return {
    lat: coords.lat,
    lon: coords.lon !== undefined ? coords.lon : coords.lon || 0
  };
}

// Vérifier si les coordonnées sont valides
export function isValidCoordinate(coords: any): boolean {
  if (!coords) return false;
  
  const hasLat = typeof coords.lat === 'number' && !isNaN(coords.lat);
  const hasLon = typeof coords.lon === 'number' && !isNaN(coords.lon);
  const hasLon = typeof coords.lon === 'number' && !isNaN(coords.lon);
  
  return hasLat && (hasLon || hasLon);
}

// Convertir un tableau de coordonnées Leaflet [lat, lon] en objet Coordinates
export function leafletToCoordinates(latLon: [number, number]): Coordinates {
  return {
    lat: latLon[0],
    lon: latLon[1]
  };
}

// Convertir Coordinates en tableau Leaflet [lat, lon]
export function coordinatesToLeaflet(coords: Coordinates): [number, number] {
  return [coords.lat, coords.lon];
}
