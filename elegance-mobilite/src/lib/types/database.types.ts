export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      audit_logs: {
        Row: {
          calculated_price: number | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          ride_id: string | null
          service: string
          updated_at: string | null
        }
        Insert: {
          calculated_price?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          ride_id?: string | null
          service: string
          updated_at?: string | null
        }
        Update: {
          calculated_price?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          ride_id?: string | null
          service?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      corporate_discounts: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          discount_type: Database["public"]["Enums"]["discount_type_enum"]
          end_date: string | null
          id: string
          min_monthly_rides: number | null
          name: string
          percentage: number
          remaining_budget: number | null
          start_date: string
          total_budget: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          discount_type: Database["public"]["Enums"]["discount_type_enum"]
          end_date?: string | null
          id?: string
          min_monthly_rides?: number | null
          name: string
          percentage: number
          remaining_budget?: number | null
          start_date: string
          total_budget?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          discount_type?: Database["public"]["Enums"]["discount_type_enum"]
          end_date?: string | null
          id?: string
          min_monthly_rides?: number | null
          name?: string
          percentage?: number
          remaining_budget?: number | null
          start_date?: string
          total_budget?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "corporate_discounts_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_rewards: {
        Row: {
          claimed_at: string | null
          created_at: string
          driver_id: string | null
          id: string
          is_claimed: boolean
          reward_type: Database["public"]["Enums"]["reward_type_enum"]
          rides_threshold: number | null
          updated_at: string
          valid_from: string
          valid_until: string
          value: number
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          is_claimed?: boolean
          reward_type: Database["public"]["Enums"]["reward_type_enum"]
          rides_threshold?: number | null
          updated_at?: string
          valid_from: string
          valid_until: string
          value: number
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          driver_id?: string | null
          id?: string
          is_claimed?: boolean
          reward_type?: Database["public"]["Enums"]["reward_type_enum"]
          rides_threshold?: number | null
          updated_at?: string
          valid_from?: string
          valid_until?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "driver_rewards_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
        ]
      }
      drivers: {
        Row: {
          availability_hours: Json | null
          avatar_url: string | null
          company_name: string | null
          company_phone: string | null
          created_at: string
          current_vehicle_id: string | null
          driving_license_expiry_date: string | null
          driving_license_number: string | null
          employee_name: string | null
          employee_phone: string | null
          first_name: string | null
          id: string
          insurance_expiry_date: string | null
          insurance_number: string | null
          languages_spoken: string[] | null
          last_name: string | null
          phone: string | null
          preferred_zones: string[] | null
          rating: number | null
          status: Database["public"]["Enums"]["driver_status"]
          total_rides: number | null
          updated_at: string
          user_id: string
          vtc_card_expiry_date: string | null
          vtc_card_number: string | null
        }
        Insert: {
          availability_hours?: Json | null
          avatar_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          current_vehicle_id?: string | null
          driving_license_expiry_date?: string | null
          driving_license_number?: string | null
          employee_name?: string | null
          employee_phone?: string | null
          first_name?: string | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_number?: string | null
          languages_spoken?: string[] | null
          last_name?: string | null
          phone?: string | null
          preferred_zones?: string[] | null
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_rides?: number | null
          updated_at?: string
          user_id: string
          vtc_card_expiry_date?: string | null
          vtc_card_number?: string | null
        }
        Update: {
          availability_hours?: Json | null
          avatar_url?: string | null
          company_name?: string | null
          company_phone?: string | null
          created_at?: string
          current_vehicle_id?: string | null
          driving_license_expiry_date?: string | null
          driving_license_number?: string | null
          employee_name?: string | null
          employee_phone?: string | null
          first_name?: string | null
          id?: string
          insurance_expiry_date?: string | null
          insurance_number?: string | null
          languages_spoken?: string[] | null
          last_name?: string | null
          phone?: string | null
          preferred_zones?: string[] | null
          rating?: number | null
          status?: Database["public"]["Enums"]["driver_status"]
          total_rides?: number | null
          updated_at?: string
          user_id?: string
          vtc_card_expiry_date?: string | null
          vtc_card_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drivers_current_vehicle_id_fkey"
            columns: ["current_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drivers_vehicle_id_fkey"
            columns: ["current_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      options: {
        Row: {
          available: boolean
          created_at: string
          description: string
          id: string
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          available?: boolean
          created_at?: string
          description: string
          id?: string
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          available?: boolean
          created_at?: string
          description?: string
          id?: string
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string
          end_date: string
          id: string
          max_discount: number | null
          max_uses: number | null
          min_ride_value: number | null
          promo_type: Database["public"]["Enums"]["promo_type_enum"]
          start_date: string
          updated_at: string
          uses_per_user: number | null
          value: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description: string
          end_date: string
          id?: string
          max_discount?: number | null
          max_uses?: number | null
          min_ride_value?: number | null
          promo_type: Database["public"]["Enums"]["promo_type_enum"]
          start_date: string
          updated_at?: string
          uses_per_user?: number | null
          value: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          max_discount?: number | null
          max_uses?: number | null
          min_ride_value?: number | null
          promo_type?: Database["public"]["Enums"]["promo_type_enum"]
          start_date?: string
          updated_at?: string
          uses_per_user?: number | null
          value?: number
        }
        Relationships: []
      }
      promo_usages: {
        Row: {
          created_at: string
          discount_amount: number
          id: string
          promo_code_id: string | null
          ride_id: string | null
          updated_at: string
          used_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          discount_amount: number
          id?: string
          promo_code_id?: string | null
          ride_id?: string | null
          updated_at?: string
          used_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          discount_amount?: number
          id?: string
          promo_code_id?: string | null
          ride_id?: string | null
          updated_at?: string
          used_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "promo_usages_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_usages_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_usages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      rates: {
        Row: {
          base_price: number
          created_at: string
          id: number
          min_price: number
          price_per_km: number
          updated_at: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type_enum"]
        }
        Insert: {
          base_price: number
          created_at?: string
          id?: number
          min_price?: number
          price_per_km: number
          updated_at?: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type_enum"]
        }
        Update: {
          base_price?: number
          created_at?: string
          id?: number
          min_price?: number
          price_per_km?: number
          updated_at?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type_enum"]
        }
        Relationships: []
      }
      ride_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          confirmed_by_client: boolean | null
          confirmed_by_driver: boolean | null
          delay_minutes: number | null
          delay_reason: string | null
          external_intervention: boolean | null
          financial_impact: number | null
          id: string
          location_lat: number | null
          location_lon: number | null
          notes: string | null
          previous_status: string | null
          reason_category: string | null
          requires_followup: boolean | null
          ride_id: string
          status: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          confirmed_by_client?: boolean | null
          confirmed_by_driver?: boolean | null
          delay_minutes?: number | null
          delay_reason?: string | null
          external_intervention?: boolean | null
          financial_impact?: number | null
          id?: string
          location_lat?: number | null
          location_lon?: number | null
          notes?: string | null
          previous_status?: string | null
          reason_category?: string | null
          requires_followup?: boolean | null
          ride_id: string
          status: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          confirmed_by_client?: boolean | null
          confirmed_by_driver?: boolean | null
          delay_minutes?: number | null
          delay_reason?: string | null
          external_intervention?: boolean | null
          financial_impact?: number | null
          id?: string
          location_lat?: number | null
          location_lon?: number | null
          notes?: string | null
          previous_status?: string | null
          reason_category?: string | null
          requires_followup?: boolean | null
          ride_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_status_history_reason_category_fkey"
            columns: ["reason_category"]
            isOneToOne: false
            referencedRelation: "status_reason_categories"
            referencedColumns: ["category_code"]
          },
          {
            foreignKeyName: "ride_status_history_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      ride_stops: {
        Row: {
          address: string
          created_at: string
          estimated_arrival: string | null
          estimated_wait_time: number | null
          id: string
          lat: number | null
          lon: number | null
          notes: string | null
          ride_id: string
          stop_order: number
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          estimated_arrival?: string | null
          estimated_wait_time?: number | null
          id?: string
          lat?: number | null
          lon?: number | null
          notes?: string | null
          ride_id: string
          stop_order: number
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          estimated_arrival?: string | null
          estimated_wait_time?: number | null
          id?: string
          lat?: number | null
          lon?: number | null
          notes?: string | null
          ride_id?: string
          stop_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ride_stops_ride_id_fkey"
            columns: ["ride_id"]
            isOneToOne: false
            referencedRelation: "rides"
            referencedColumns: ["id"]
          },
        ]
      }
      rides: {
        Row: {
          created_at: string
          distance: number | null
          driver_id: string | null
          dropoff_address: string
          dropoff_lat: number | null
          dropoff_lon: number | null
          duration: number | null
          estimated_price: number | null
          final_price: number | null
          id: string
          options: string[] | null
          override_vehicle_id: string | null
          pickup_address: string
          pickup_lat: number | null
          pickup_lon: number | null
          pickup_notes: string | null
          pickup_time: string
          price: number | null
          status: Database["public"]["Enums"]["ride_status"]
          updated_at: string
          user_id: string | null
          vehicle_type: string
        }
        Insert: {
          created_at?: string
          distance?: number | null
          driver_id?: string | null
          dropoff_address: string
          dropoff_lat?: number | null
          dropoff_lon?: number | null
          duration?: number | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          options?: string[] | null
          override_vehicle_id?: string | null
          pickup_address: string
          pickup_lat?: number | null
          pickup_lon?: number | null
          pickup_notes?: string | null
          pickup_time: string
          price?: number | null
          status?: Database["public"]["Enums"]["ride_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_type: string
        }
        Update: {
          created_at?: string
          distance?: number | null
          driver_id?: string | null
          dropoff_address?: string
          dropoff_lat?: number | null
          dropoff_lon?: number | null
          duration?: number | null
          estimated_price?: number | null
          final_price?: number | null
          id?: string
          options?: string[] | null
          override_vehicle_id?: string | null
          pickup_address?: string
          pickup_lat?: number | null
          pickup_lon?: number | null
          pickup_notes?: string | null
          pickup_time?: string
          price?: number | null
          status?: Database["public"]["Enums"]["ride_status"]
          updated_at?: string
          user_id?: string | null
          vehicle_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "rides_driver_id_fkey"
            columns: ["driver_id"]
            isOneToOne: false
            referencedRelation: "drivers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_override_vehicle_id_fkey"
            columns: ["override_vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      seasonal_promotions: {
        Row: {
          active: boolean
          created_at: string
          description: string
          discount_percentage: number
          end_date: string
          id: string
          name: string
          start_date: string
          time_slots: Json | null
          updated_at: string
          vehicle_types:
            | Database["public"]["Enums"]["vehicle_type_enum"][]
            | null
          zones: string[] | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          description: string
          discount_percentage: number
          end_date: string
          id?: string
          name: string
          start_date: string
          time_slots?: Json | null
          updated_at?: string
          vehicle_types?:
            | Database["public"]["Enums"]["vehicle_type_enum"][]
            | null
          zones?: string[] | null
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string
          discount_percentage?: number
          end_date?: string
          id?: string
          name?: string
          start_date?: string
          time_slots?: Json | null
          updated_at?: string
          vehicle_types?:
            | Database["public"]["Enums"]["vehicle_type_enum"][]
            | null
          zones?: string[] | null
        }
        Relationships: []
      }
      status_reason_categories: {
        Row: {
          category_code: string
          description: string
          id: number
          requires_approval: boolean | null
          requires_notes: boolean | null
        }
        Insert: {
          category_code: string
          description: string
          id?: number
          requires_approval?: boolean | null
          requires_notes?: boolean | null
        }
        Update: {
          category_code?: string
          description?: string
          id?: number
          requires_approval?: boolean | null
          requires_notes?: boolean | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          app_metadata: Json | null
          created_at: string | null
          id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          app_metadata?: Json | null
          created_at?: string | null
          id?: never
          updated_at?: string | null
          user_id: string
        }
        Update: {
          app_metadata?: Json | null
          created_at?: string | null
          id?: never
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          created_at: string
          id: string
          license_plate: string
          updated_at: string
          vehicle_model: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type_enum"]
        }
        Insert: {
          created_at?: string
          id?: string
          license_plate: string
          updated_at?: string
          vehicle_model: string
          vehicle_type: Database["public"]["Enums"]["vehicle_type_enum"]
        }
        Update: {
          created_at?: string
          id?: string
          license_plate?: string
          updated_at?: string
          vehicle_model?: string
          vehicle_type?: Database["public"]["Enums"]["vehicle_type_enum"]
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_driver_accept_rides: {
        Args: { driver_user_id: string }
        Returns: {
          can_accept: boolean
          reason: string
          profile_status: string
          validation_status: string
        }[]
      }
      check_admin_access: {
        Args: { user_id: string }
        Returns: Json
      }
      check_driver_profile_completeness: {
        Args: { driver_user_id: string }
        Returns: {
          is_complete: boolean
          missing_fields: string[]
          completion_percentage: number
        }[]
      }
      check_user_role_update: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      create_pending_driver: {
        Args: {
          p_first_name: string
          p_last_name: string
          p_phone: string
          p_vtc_card_number: string
          p_driving_license_number: string
          p_vtc_card_expiry_date: string
          p_driving_license_expiry_date: string
          p_insurance_number?: string
          p_insurance_expiry_date?: string
          p_languages_spoken?: string[]
          p_preferred_zones?: string[]
          p_company_name?: string
          p_company_phone?: string
        }
        Returns: Json
      }
      create_user_profile: {
        Args: { user_id: string; user_role: string }
        Returns: boolean
      }
      debug_check_driver_profile_completeness: {
        Args: { driver_user_id: string }
        Returns: {
          is_complete: boolean
          completion_percentage: number
          missing_fields: string[]
          debug_info: Json
        }[]
      }
      delete_user_and_associated_data: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      delete_user_by_id: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      ensure_driver_profile: {
        Args: { driver_user_id: string }
        Returns: string
      }
      get_admin_level: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_effective_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_incomplete_drivers_report: {
        Args: Record<PropertyKey, never>
        Returns: {
          user_id: string
          first_name: string
          last_name: string
          status: Database["public"]["Enums"]["driver_status"]
          is_complete: boolean
          completion_percentage: number
          missing_fields: string[]
        }[]
      }
      get_safe_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_app_role: {
        Args: { user_id?: string }
        Returns: string
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: Json
      }
      get_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_driver: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_super_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      setup_admin_policies: {
        Args: { admin_id: string }
        Returns: undefined
      }
      update_driver_status_based_on_completeness: {
        Args: { driver_user_id: string }
        Returns: string
      }
      validate_driver: {
        Args: {
          driver_id: string
          approved: boolean
          rejection_reason?: string
        }
        Returns: Json
      }
    }
    Enums: {
      discount_type_enum: "percentage" | "fixed"
      driver_status:
        | "pending_validation"
        | "active"
        | "inactive"
        | "on_vacation"
        | "suspended"
        | "incomplete"
      promo_type_enum: "percentage" | "fixed_amount"
      reward_type_enum: "bonus" | "commission_increase"
      ride_status:
        | "pending"
        | "scheduled"
        | "in-progress"
        | "completed"
        | "client-canceled"
        | "driver-canceled"
        | "admin-canceled"
        | "no-show"
        | "delayed"
      vehicle_type_enum: "STANDARD" | "PREMIUM" | "VAN" | "ELECTRIC"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      discount_type_enum: ["percentage", "fixed"],
      driver_status: [
        "pending_validation",
        "active",
        "inactive",
        "on_vacation",
        "suspended",
        "incomplete",
      ],
      promo_type_enum: ["percentage", "fixed_amount"],
      reward_type_enum: ["bonus", "commission_increase"],
      ride_status: [
        "pending",
        "scheduled",
        "in-progress",
        "completed",
        "client-canceled",
        "driver-canceled",
        "admin-canceled",
        "no-show",
        "delayed",
      ],
      vehicle_type_enum: ["STANDARD", "PREMIUM", "VAN", "ELECTRIC"],
    },
  },
} as const
