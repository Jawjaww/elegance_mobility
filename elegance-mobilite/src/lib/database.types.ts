export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type VehicleType = 'STANDARD' | 'PREMIUM' | 'ELECTRIC' | 'VAN';
export type DriverStatus = 'active' | 'inactive';
export type RideStatus = 'unassigned' | 'pending' | 'in-progress' | 'completed' | 'cancelled';
export type UserRole = 'admin' | 'client' | 'driver';

export interface UserMetadata {
  email_verified: boolean;
  is_super_admin: boolean;
}

export interface AppMetadata {
  role: UserRole;
  provider: string;
  providers: string[];
}
export type PromoType = 'percentage' | 'fixed_amount' | 'free_options';
export type DiscountType = 'volume' | 'loyalty' | 'corporate';
export type RewardType = 'commission_reduction' | 'bonus_payment' | 'priority_dispatch';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          role: UserRole
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role: UserRole
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: UserRole
          created_at?: string
          updated_at?: string
        }
      }
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
          user_id: string
          first_name: string
          last_name: string
          company_name: string
          company_phone: string
          employee_phone: string
          employee_name: string
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
          total_rides: number
          languages_spoken: string[] | null
          preferred_zones: string[] | null
          availability_hours: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          company_name: string
          company_phone: string
          employee_phone: string
          employee_name: string
          phone: string
          status?: DriverStatus
          avatar_url?: string | null
          vehicle_id?: string | null
          vtc_card_number: string
          driving_license_number: string
          vtc_card_expiry_date: string
          driving_license_expiry_date: string
          insurance_number?: string | null
          insurance_expiry_date?: string | null
          rating?: number | null
          total_rides?: number
          languages_spoken?: string[] | null
          preferred_zones?: string[] | null
          availability_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          company_name?: string
          company_phone?: string
          employee_phone?: string
          employee_name?: string
          phone?: string
          status?: DriverStatus
          avatar_url?: string | null
          vehicle_id?: string | null
          vtc_card_number?: string
          driving_license_number?: string
          vtc_card_expiry_date?: string
          driving_license_expiry_date?: string
          insurance_number?: string | null
          insurance_expiry_date?: string | null
          rating?: number | null
          total_rides?: number
          languages_spoken?: string[] | null
          preferred_zones?: string[] | null
          availability_hours?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      rides: {
        Row: {
          id: string
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
      promo_codes: {
        Row: {
          id: string
          code: string
          description: string
          promo_type: PromoType
          value: number
          min_ride_value: number | null
          max_discount: number | null
          start_date: string
          end_date: string
          max_uses: number | null
          uses_per_user: number | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          code: string
          description: string
          promo_type: PromoType
          value: number
          min_ride_value?: number | null
          max_discount?: number | null
          start_date: string
          end_date: string
          max_uses?: number | null
          uses_per_user?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          code?: string
          description?: string
          promo_type?: PromoType
          value?: number
          min_ride_value?: number | null
          max_discount?: number | null
          start_date?: string
          end_date?: string
          max_uses?: number | null
          uses_per_user?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      promo_usages: {
        Row: {
          id: string
          promo_code_id: string
          user_id: string
          ride_id: string
          discount_amount: number
          used_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          promo_code_id: string
          user_id: string
          ride_id: string
          discount_amount: number
          used_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          promo_code_id?: string
          user_id?: string
          ride_id?: string
          discount_amount?: number
          used_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      corporate_discounts: {
        Row: {
          id: string
          name: string
          company_id: string
          discount_type: DiscountType
          percentage: number
          min_monthly_rides: number | null
          total_budget: number | null
          remaining_budget: number | null
          start_date: string
          end_date: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          company_id: string
          discount_type: DiscountType
          percentage: number
          min_monthly_rides?: number | null
          total_budget?: number | null
          remaining_budget?: number | null
          start_date: string
          end_date?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          company_id?: string
          discount_type?: DiscountType
          percentage?: number
          min_monthly_rides?: number | null
          total_budget?: number | null
          remaining_budget?: number | null
          start_date?: string
          end_date?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      driver_rewards: {
        Row: {
          id: string
          driver_id: string
          reward_type: RewardType
          value: number
          rides_threshold: number | null
          valid_from: string
          valid_until: string | null
          is_claimed: boolean
          claimed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          driver_id: string
          reward_type: RewardType
          value: number
          rides_threshold?: number | null
          valid_from: string
          valid_until?: string | null
          is_claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          driver_id?: string
          reward_type?: RewardType
          value?: number
          rides_threshold?: number | null
          valid_from?: string
          valid_until?: string | null
          is_claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      seasonal_promotions: {
        Row: {
          id: string
          name: string
          description: string
          discount_percentage: number
          vehicle_types: VehicleType[]
          zones: string[] | null
          time_slots: Json | null
          start_date: string
          end_date: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          discount_percentage: number
          vehicle_types: VehicleType[]
          zones?: string[] | null
          time_slots?: Json | null
          start_date: string
          end_date: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          discount_percentage?: number
          vehicle_types?: VehicleType[]
          zones?: string[] | null
          time_slots?: Json | null
          start_date?: string
          end_date?: string
          active?: boolean
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
    }
    Views: {
      user_profiles: {
        Row: {
          id: string
          email: string
          role: UserRole
          created_at: string
          updated_at: string
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      vehicle_type_enum: VehicleType
      driver_status: DriverStatus
      ride_status: RideStatus
      promo_type_enum: PromoType
      discount_type_enum: DiscountType
      reward_type_enum: RewardType
    }
  }
}
