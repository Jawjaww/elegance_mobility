/**
 * Types unifiés pour le driver dashboard
 * Basés sur database.types.ts
 */

import type { Database } from '@/lib/types/database.types'

// Types de la base de données
export type DbRide = Database['public']['Tables']['rides']['Row']
export type DbDriver = Database['public']['Tables']['drivers']['Row']
export type DbDriverLocation = Database['public']['Tables']['driver_locations']['Row']

// Types enrichis pour le frontend
export interface Ride {
  id: string
  pickup_address: string
  dropoff_address: string
  pickup_lat: number
  pickup_lng: number
  dropoff_lat: number
  dropoff_lng: number
  estimated_price: number | null
  final_price: number | null
  distance: number | null
  duration: number | null
  status: Database['public']['Enums']['ride_status']
  passenger_name?: string
  passenger_rating?: number
  pickup_time: string
  created_at: string
}

export interface DriverStats {
  todayEarnings: number
  todayRides: number
  onlineTimeMinutes: number
  rating: number
}

export interface Location {
  lat: number
  lng: number
  heading?: number | null
  speed?: number | null
  accuracy?: number | null
}

// Props des composants
export interface DriverMapProps {
  pickup?: { lat: number; lng: number } | null
  dropoff?: { lat: number; lng: number } | null
  driverLocation?: Location | null
}

export interface SheetProps {
  children: React.ReactNode
  open: boolean
  onClose?: () => void
}

export interface RideRequestProps {
  ride: Ride
  onAccept: () => void
  onDecline: () => void
  isAccepting?: boolean
  countdown: number
}
