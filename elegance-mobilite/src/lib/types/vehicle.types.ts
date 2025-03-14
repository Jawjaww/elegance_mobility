/**
 * Types pour les véhicules et options de réservation
 */

// Types de véhicule
export enum VehicleType {
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ELECTRIC = 'ELECTRIC',
  VAN = 'VAN'
}

// Options de véhicule
export interface VehicleOptions {
  childSeat: boolean;
  petFriendly: boolean;
  [key: string]: boolean | undefined; // Index signature pour permettre l'accès dynamique
}

// Configuration de tarif
export interface RateConfig {
  basePrice: number;
  perKmPrice: number;
  minPrice: number;
}

// Information de véhicule
export interface VehicleInfo {
  id: string;
  vehicleType: VehicleType;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  capacity: number;
  available: boolean;
}
