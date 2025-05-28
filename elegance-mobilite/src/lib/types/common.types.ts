import type { User as SupabaseUser } from '@supabase/supabase-js'

// Type étendu avec les colonnes de auth.users
export interface User extends SupabaseUser {
  first_name?: string
  last_name?: string
  email_change?: string
  email_change_sent_at?: string
  email_change_token_current?: string
  email_change_token_new?: string
  last_sign_in_at?: string
  phone_change?: string
  avatar_url?: string
  role?: AppRole
  status?: DriverStatus
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type PostgrestError = {
  message: string
  details: string
  hint: string
  code: string
}

// Types de rôle sans extension de User
export type AppRole = 'app_customer' | 'app_driver' | 'app_admin' | 'app_super_admin'

// Statut des chauffeurs
export type DriverStatus = 'active' | 'inactive' | 'suspended'

// Statuts de course
export type RideStatus = 
  | 'pending'
  | 'scheduled'
  | 'accepted'
  | 'assigned'
  | 'in_progress'
  | 'in-progress'
  | 'completed'
  | 'canceled'
  | 'client-canceled'
  | 'driver-canceled'
  | 'admin-canceled'
  | 'no_show'
  | 'no-show'
  | 'delayed'

// Tables publiques uniquement (pas de redéfinition de auth.users)
export interface Database {
  public: {
    drivers: {
      Row: {
        id: string
        user_id: string
        first_name: string
        last_name: string
        phone: string
        status: DriverStatus
        avatar_url: string | null
        vehicle_id: string | null
        vtc_card_number: string
        driving_license_number: string
        vtc_card_expiry_date: string
        driving_license_expiry_date: string
        insurance_number: string | null
        insurance_expiry_date: string | null
        rating: number | null
        total_rides: number | null
        languages_spoken: string[] | null
        preferred_zones: string[] | null
        availability_hours: Json | null
        company_name: string
        company_phone: string
        employee_phone: string
        employee_name: string
        created_at: string
        updated_at: string
      }
      Insert: Omit<Database['public']['drivers']['Row'], 'id' | 'created_at' | 'updated_at'>
      Update: Partial<Database['public']['drivers']['Insert']>
    }
    rides: {
      Row: {
        id: string
        user_id: string
        driver_id: string | null
        status: RideStatus
        pickup_address: string
        dropoff_address: string
        pickup_lat: number | null
        pickup_lon: number | null
        dropoff_lat: number | null
        dropoff_lon: number | null
        pickup_time: string
        distance: number | null
        duration: number | null
        vehicle_type: string
        options: string[]
        estimated_price: number
        final_price: number | null
        created_at: string
        updated_at: string
      }
      Insert: Omit<Database['public']['rides']['Row'], 'id' | 'created_at' | 'updated_at'>
      Update: Partial<Database['public']['rides']['Insert']>
    }
    vehicles: {
      Row: {
        id: string
        license_plate: string
        vehicle_type: string
        vehicle_model: string
        created_at: string
        updated_at: string
      }
      Insert: Omit<Database['public']['vehicles']['Row'], 'id' | 'created_at' | 'updated_at'>
      Update: Partial<Database['public']['vehicles']['Insert']>
    }
    price_rates: {
      Row: {
        id: string
        base_rate: number
        price_per_km: number
        vehicle_type: string
        min_price: number | null
        max_price: number | null
        created_at: string
        updated_at: string
      }
      Insert: Omit<Database['public']['price_rates']['Row'], 'id' | 'created_at' | 'updated_at'>
      Update: Partial<Database['public']['price_rates']['Insert']>
    }
  }
}

// Types utilitaires (tables publiques uniquement)
export type DbDriver = Database['public']['drivers']['Row']
export type DbRide = Database['public']['rides']['Row']
export type Ride = Database['public']['rides']['Row'] // Alias pour compatibilité
export type DbVehicle = Database['public']['vehicles']['Row']
export type DbPriceRate = Database['public']['price_rates']['Row']
export type FilterRideStatus = RideStatus | 'all';

// Types de véhicules
export type VehicleType = 'STANDARD' | 'PREMIUM' | 'VAN' | 'ELECTRIC'

// Helpers de vérification des rôles sans modification du type User

export function getAppRole(user?: User | null): string | undefined {
  return (
    (user as any)?.raw_app_meta_data?.role ||
    (user as any)?.app_metadata?.role ||
    (user as any)?.user_metadata?.role ||
    user?.role
  );
}

export function isAdmin(user?: User | null): boolean {
  const role = getAppRole(user);
  return role === 'app_admin' || role === 'app_super_admin';
}

export function isDriver(user?: User | null): boolean {
  return getAppRole(user) === 'app_driver';
}

export function isCustomer(user?: User | null): boolean {
  return getAppRole(user) === 'app_customer';
}