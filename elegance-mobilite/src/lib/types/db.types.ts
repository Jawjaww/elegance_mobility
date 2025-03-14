/**
 * Types pour les structures de base de données de Supabase
 */

// Structure des tables SQL optimisées
export interface DbUser {
  id: string;
  role: string;
  admin_level?: string; // Uniquement pour les utilisateurs admin
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

export interface DbRide {
  id: string;
  user_id: string;
  status: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string;
  estimated_price: number | null;
  driver_id: string | null;
  override_vehicle_id: string | null; // Véhicule temporaire pour une course spécifique
  created_at: string;
  updated_at: string;
  pickup_lat: number | null;
  pickup_lon: number | null; // Standardisé sur lon uniquement
  dropoff_lat: number | null;
  dropoff_lon: number | null; // Standardisé sur lon uniquement
  distance: number | null;
  duration: number | null;
  vehicle_type: string | null;
  options: string[] | null;
}

export interface DbOption {
  id: string;
  name: string;
  description: string;
  price: number;
  available: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbRate {
  id: number;
  vehicle_type: string;
  price_per_km: number;
  base_price: number;
  created_at: string;
  updated_at: string;
}

export interface DbVehicle {
  id: string;
  license_plate: string;
  vehicle_type: string;
  model: string;
  make: string;
  year: number;
  capacity: number;
  available: boolean;
  created_at: string;
  updated_at: string;
}
