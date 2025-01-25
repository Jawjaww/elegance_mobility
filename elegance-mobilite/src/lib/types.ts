/// <reference types="@types/google.maps" />

declare global {
  interface Window {
    google: typeof google;
  }
}

// Types de base pour les coordonnées géographiques
export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapConfig {
  center: LatLng;
  zoom: number;
  markers: {
    position: LatLng;
    color?: string;
    label?: string;
  }[];
}

// Type pour les marqueurs de carte
export interface LatLng {
  lat: number;
  lng: number;
}

export interface MapMarker {
  position: LatLng;
  label: string;
  icon?: google.maps.Symbol;
}

export interface MapConfig {
  center: LatLng;
  zoom: number;
  markers: {
    position: LatLng;
    color?: string;
    label?: string;
  }[];
}

export interface MapConfig {
  center: LatLng;
  zoom: number;
  markers: {
    position: LatLng;
    color?: string;
    label?: string;
  }[];
}

// Type pour les résultats de géocodage Google
export interface GooglePlace {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  location: LatLng;
}

// Type pour les données de réservation
export interface VehicleCategory {
  id: string;
  type: 'STANDARD' | 'PREMIUM' | 'VIP';
  baseRate: number;
  peakRate: number;
  nightRate: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateVehicleCategory {
  type: 'STANDARD' | 'PREMIUM' | 'VIP';
  baseRate: number;
  peakRate: number;
  nightRate: number;
}

export interface ReservationData {
  origin: string;
  destination: string;
  pickupDateTime: Date;
  vehicleType: VehicleCategory;
  options: {
    luggage: boolean;
    childSeat: boolean;
    petFriendly: boolean;
  };
  distance: number;
  duration: number;
}

// Type pour la réponse d'itinéraire
export interface RouteResult {
  distance: number;
  duration: number;
  points: LatLng[];
}
