export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type VehicleType = 'STANDARD' | 'PREMIUM' | 'ELECTRIC'| 'VAN';
export type DriverStatus = 'active' | 'inactive';
export type RideStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Database {
  public: {
    Tables: {
      vehicles: {
        Row: {
          id: string
          license_plate: string
          vehicle_type: VehicleType
          vehicle_model: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          license_plate: string
          vehicle_type: VehicleType
          vehicle_model: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          license_plate?: string
          vehicle_type?: VehicleType
          vehicle_model?: string
          created_at?: string
          updated_at?: string
        }
      }
      drivers: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          status: DriverStatus
          avatar_url: string | null
          vehicle_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          status?: DriverStatus
          avatar_url?: string | null
          vehicle_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          status?: DriverStatus
          avatar_url?: string | null
          vehicle_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      rides: {
        Row: {
          id: string
          status: RideStatus
          pickup_address: string
          dropoff_address: string
          pickup_time: string
          estimated_price: number | null
          driver_id: string | null
          override_vehicle_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          status?: RideStatus
          pickup_address: string
          dropoff_address: string
          pickup_time: string
          estimated_price?: number | null
          driver_id?: string | null
          override_vehicle_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          status?: RideStatus
          pickup_address?: string
          dropoff_address?: string
          pickup_time?: string
          estimated_price?: number | null
          driver_id?: string | null
          override_vehicle_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      options: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          price: number
          available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      rates: {
        Row: {
          id: number
          vehicle_type: VehicleType
          price_per_km: number
          base_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          vehicle_type: VehicleType
          price_per_km: number
          base_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          vehicle_type?: VehicleType
          price_per_km?: number
          base_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          created_at: string
          email: string
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      vehicle_type_enum: VehicleType
      driver_status: DriverStatus
      ride_status: RideStatus
    }
  }
}