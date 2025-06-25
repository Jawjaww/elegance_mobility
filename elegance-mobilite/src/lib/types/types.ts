/**
 * Adaptateurs de types pour maintenir la compatibilité entre différentes parties de l'application
 */
import { VehicleType as VehicleTypeEnum, VehicleOptions as VehicleOptionsStrict } from './vehicle.types';
import { Coordinates, Location } from './map-types';

// Fonction adaptateur pour convertir les options de véhicule
export function adaptVehicleOptions(options: any): VehicleOptionsStrict {
  return {
    childSeat: options.childSeat || false,
    petFriendly: options.petFriendly || options.pets || false
  };
}

// Convertisseur pour adapter VehicleType
export function adaptVehicleType(type: string): VehicleTypeEnum {
  switch(type.toUpperCase()) {
    case 'STANDARD': return VehicleTypeEnum.STANDARD;
    case 'PREMIUM': return VehicleTypeEnum.PREMIUM;
    case 'ELECTRIC': return VehicleTypeEnum.ELECTRIC;
    case 'VAN': return VehicleTypeEnum.VAN;
    default: return VehicleTypeEnum.STANDARD;
  }
}

// Re-export des types essentiels pour assurer la compatibilité
export type { VehicleTypeEnum as VehicleType, VehicleOptionsStrict as VehicleOptions };

/**
 * Types pour MapLibre GL
 */

// Interface pour les marques sur la carte
export interface MapMarker {
  position: [number, number]; // [longitude, latitude] format pour MapLibre
  address?: string;
  color?: string;
  icon?: string;
  tooltip?: string;
  draggable?: boolean;
  onClick?: () => void;
}

// Interface pour les styles de ligne sur la carte
export interface MapLineStyle {
  color: string;
  width: number;
  opacity: number;
  dashArray?: number[];
}

// Interface pour les options de route
export interface RouteOptions {
  profile?: 'driving' | 'walking' | 'cycling';
  alternatives?: boolean;
  geometries?: 'polyline' | 'polyline6' | 'geojson';
  steps?: boolean;
  overview?: 'full' | 'simplified' | 'false';
  annotations?: boolean;
}

// Interface pour une route calculée
export interface CalculatedRoute {
  distance: number; // En mètres
  duration: number; // En secondes
  geometry: {
    coordinates: [number, number][]; // Points de la ligne [lon, lat]
    type: 'LineString';
  };
}

/**
 * Types partagés pour l'application 
 */

export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  plate_number: string;
  type: string;
  status: string;
  capacity?: number;
  year?: number;
  color?: string;
  driver_id?: string | null;
}

// Type pour les options de la carte MapLibre
export interface MapOptions {
  container: string | HTMLElement;
  center?: [number, number]; // [longitude, latitude]
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
  style?: any;
  interactive?: boolean;
  bearingSnap?: number;
  attributionControl?: boolean;
  customAttribution?: string | string[];
  preserveDrawingBuffer?: boolean; // Ajout de la propriété manquante
}

// Exporter d'autres types communs si nécessaire...
