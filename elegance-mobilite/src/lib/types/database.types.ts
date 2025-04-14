// Types générés pour Supabase - NE PAS MODIFIER
export interface Database {
  auth: {
    users: {
      Row: {
        instance_id: string | null;
        id: string;
        aud: string | null;
        role: string | null;
        email: string | null;
        encrypted_password: string | null;
        email_confirmed_at: string | null;
        invited_at: string | null;
        confirmation_token: string | null;
        confirmation_sent_at: string | null;
        recovery_token: string | null;
        recovery_sent_at: string | null;
        email_change_token_new: string | null;
        email_change: string | null;
        email_change_sent_at: string | null;
        last_sign_in_at: string | null;
        raw_app_meta_data: Record<string, any> | null;
        raw_user_meta_data: {
          name?: string;
          phone?: string;
          avatar_url?: string;
          [key: string]: any;
        } | null;
        created_at: string | null;
        updated_at: string | null;
        phone: string | null;
        phone_confirmed_at: string | null;
        phone_change: string | null;
        phone_change_token: string | null;
        phone_change_sent_at: string | null;
        confirmed_at: string | null;
        email_change_token_current: string | null;
        email_change_confirm_status: number | null;
        banned_until: string | null;
        reauthentication_token: string | null;
        reauthentication_sent_at: string | null;
        is_sso_user: boolean;
        deleted_at: string | null;
        is_anonymous: boolean;
      };
    };
  };
  public: {
    rides: {
      Row: {
        id: string;
        user_id: string | null;
        driver_id: string | null;
        override_vehicle_id: string | null;
        status: 'pending' | 'completed' | 'canceled';
        pickup_address: string;
        pickup_lat: number | null;
        pickup_lon: number | null;
        dropoff_address: string;
        dropoff_lat: number | null;
        dropoff_lon: number | null;
        pickup_time: string;
        distance: number | null;
        duration: number | null;
        vehicle_type: string;
        options: string[];
        estimated_price: number | null;
        final_price: number | null;
        created_at: string;
        updated_at: string;
      };
    };
    vehicles: {
      Row: {
        id: string;
        license_plate: string;
        vehicle_type: string;
        vehicle_model: string;
        created_at: string;
        updated_at: string;
      };
    };
  };
}

// Réexporter les types utiles
export type Tables = Database['public'];
export type AuthUser = Database['auth']['users']['Row'];
export type Ride = Tables['rides']['Row'];
export type Vehicle = Tables['vehicles']['Row'];