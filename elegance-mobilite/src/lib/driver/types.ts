/**
 * Types unifiés pour le driver dashboard
 * Basés sur database.types.ts
 */

import type { Database } from "@/lib/types/database.types";

// Types de la base de données
export type DbRide = Database["public"]["Tables"]["rides"]["Row"];
export type DbDriver = Database["public"]["Tables"]["drivers"]["Row"];
export type DbDriverLocation =
  Database["public"]["Tables"]["driver_locations"]["Row"];

// Types enrichis pour le frontend
export interface Ride {
  id: string;
  pickupLocation: string;
  dropoffLocation: string;
  pickupLat: number;
  pickupLng: number;
  dropoffLat: number;
  dropoffLng: number;
  estimatedPrice: number | null;
  finalPrice: number | null;
  estimatedDistance: number | null;
  estimatedDuration: number | null;
  status: Database["public"]["Enums"]["ride_status"];
  clientId?: string;
  pickupTime: string | null;
  createdAt: string;
  vehicleType: string;
  options?: string[];
}

export interface DriverStats {
  todayEarnings: number;
  todayRides: number;
  onlineTimeMinutes: number;
  rating: number;
}

export interface Location {
  lat: number;
  lng: number;
  heading?: number | null;
  speed?: number | null;
  accuracy?: number | null;
}

// Props des composants
export interface DriverMapProps {
  pickup?: { lat: number; lng: number } | null;
  dropoff?: { lat: number; lng: number } | null;
  driverLocation?: Location | null;
}

export interface SheetProps {
  children: React.ReactNode;
  open: boolean;
  onClose?: () => void;
}

export interface RideRequestProps {
  ride: Ride;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting?: boolean;
  countdown: number;
}
