"use client";

import { createServerSupabaseClient } from "@/lib/database/server";

export interface BookingData {
  user_id: string;
  pickup_address: string;
  dropoff_address: string; 
  pickup_time: string;     
  estimated_price: number; 
  pickup_lat?: number;
  pickup_lon?: number;
  dropoff_lat?: number;
  dropoff_lon?: number;
  distance?: number;
  duration?: number;
  vehicle_type?: string;
  options?: string[];
  stops?: RideStop[]; 
}

export interface RideStop {
  address: string;
  lat?: number;
  lon?: number;
  estimated_arrival?: string;
  estimated_wait_time?: number;
  notes?: string;
}

class BookingService {
  private MAX_RETRIES = 3;
  private RETRY_DELAY = 1000;

  private async retryOperation<T>(operation: () => Promise<T>): Promise<T> {
    let lastError;
    for (let attempt = 0; attempt < this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error) {
        console.warn(`Tentative ${attempt + 1} échouée:`, error);
        lastError = error;
        if (attempt < this.MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY * (attempt + 1)));
        }
      }
    }
    throw lastError;
  }

  /**
   * Vérifie si le service est disponible
   */
  async isServiceAvailable(): Promise<boolean> {
    try {
      const supabase = await createServerSupabaseClient();
      const { data } = await supabase.from('health').select('*').limit(1);
      return !!data;
    } catch {
      return false;
    }
  }

  /**
   * Crée une nouvelle réservation
   */
  async createBooking(bookingData: BookingData): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      // Vérifier la connexion
      if (!await this.isServiceAvailable()) {
        return {
          success: false,
          error: "Service indisponible. Veuillez vérifier votre connexion."
        };
      }

      const supabase = await createServerSupabaseClient();
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        return {
          success: false,
          error: "Utilisateur non connecté"
        };
      }

      const userId = session.user.id;
      bookingData.user_id = userId;

      const { data: ride, error: rideError } = await supabase
        .from('rides')
        .insert({
          user_id: userId,
          pickup_address: bookingData.pickup_address,
          dropoff_address: bookingData.dropoff_address,
          pickup_time: bookingData.pickup_time,
          estimated_price: bookingData.estimated_price,
          status: 'pending',
          pickup_lat: bookingData.pickup_lat,
          pickup_lon: bookingData.pickup_lon,
          dropoff_lat: bookingData.dropoff_lat,
          dropoff_lon: bookingData.dropoff_lon,
          distance: bookingData.distance,
          duration: bookingData.duration,
          vehicle_type: bookingData.vehicle_type,
          options: bookingData.options || []
        })
        .select()
        .single();

      if (rideError) {
        throw rideError;
      }

      if (bookingData.stops?.length) {
        const stopsWithRideId = bookingData.stops.map((stop, index) => ({
          ride_id: ride.id,
          stop_order: index + 1,
          ...stop
        }));

        const { error: stopsError } = await supabase
          .from('ride_stops')
          .insert(stopsWithRideId);

        if (stopsError) {
          console.warn("Erreur lors de l'ajout des arrêts:", stopsError);
        }
      }

      return {
        success: true,
        id: ride.id
      };

    } catch (error: any) {
      console.error("Erreur lors de la création de la réservation:", error);
      return {
        success: false,
        error: error.message || "Erreur lors de la création de la réservation"
      };
    }
  }

  /**
   * Récupère les réservations d'un utilisateur
   */
  async getUserBookings(userId: string) {
    try {
      return await this.retryOperation(async () => {
        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase
          .from('rides')
          .select('*')
          .eq('user_id', userId)
          .order('pickup_time', { ascending: false });

        if (error) throw error;
        return { data, error: null };
      });
    } catch (error: any) {
      console.error("Erreur lors de la récupération des réservations:", error);
      return {
        data: null,
        error: error.message || "Erreur lors de la récupération des réservations"
      };
    }
  }
  
  /**
   * Récupère une réservation par son ID avec ses arrêts intermédiaires
   */
  async getBookingById(bookingId: string): Promise<{ data: any | null; error: string | null }> {
    try {
      return await this.retryOperation(async () => {
        const supabase = await createServerSupabaseClient();
        
        // Récupérer la réservation et ses arrêts
        const [rideResult, stopsResult] = await Promise.all([
          supabase
            .from('rides')
            .select('*')
            .eq('id', bookingId)
            .single(),
          
          supabase
            .from('ride_stops')
            .select('*')
            .eq('ride_id', bookingId)
            .order('stop_order')
        ]);
        
        if (rideResult.error) throw rideResult.error;
        
        // Même si la récupération des arrêts échoue, on renvoie la réservation
        if (stopsResult.error) {
          console.warn("Erreur lors de la récupération des arrêts:", stopsResult.error);
        }
        
        // Combiner la réservation et ses arrêts
        const bookingWithStops = {
          ...rideResult.data,
          stops: stopsResult.data || []
        };
        
        return { data: bookingWithStops, error: null };
      });
    } catch (error: any) {
      console.error("Erreur lors de la récupération de la réservation:", error);
      return {
        data: null,
        error: error.message || "Erreur lors de la récupération de la réservation"
      };
    }
  }
  
  /**
   * Annule une réservation
   */
  async cancelBooking(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.retryOperation(async () => {
        const supabase = await createServerSupabaseClient();
        const { error } = await supabase
          .from('rides')
          .update({ status: 'canceled' })
          .eq('id', bookingId);
          
        if (error) {
          throw error;
        }
        
        return { success: true };
      });
    } catch (error: any) {
      console.error("Erreur lors de l'annulation de la réservation:", error);
      return {
        success: false,
        error: error.message || "Erreur lors de l'annulation de la réservation"
      };
    }
  }

  /**
   * Ajoute un arrêt intermédiaire à une réservation existante
   */
  async addRideStop(rideId: string, stop: RideStop): Promise<{ success: boolean; error?: string }> {
    try {
      return await this.retryOperation(async () => {
        const supabase = await createServerSupabaseClient();
        
        // Vérifier que l'utilisateur est connecté
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          return { success: false, error: "Utilisateur non connecté" };
        }
        
        // Obtenir l'ordre du prochain arrêt
        const { data: lastStop } = await supabase
          .from('ride_stops')
          .select('stop_order')
          .eq('ride_id', rideId)
          .order('stop_order', { ascending: false })
          .limit(1)
          .single();
        
        const nextOrder = lastStop ? lastStop.stop_order + 1 : 1;
        
        // Insérer le nouvel arrêt
        const { error } = await supabase
          .from('ride_stops')
          .insert({
            ride_id: rideId,
            stop_order: nextOrder,
            address: stop.address,
            lat: stop.lat,
            lon: stop.lon,
            estimated_arrival: stop.estimated_arrival,
            estimated_wait_time: stop.estimated_wait_time,
            notes: stop.notes
          });
          
        if (error) {
          throw error;
        }
        
        return { success: true };
      });
    } catch (error: any) {
      console.error("Erreur lors de l'ajout d'un arrêt:", error);
      return {
        success: false,
        error: error.message || "Erreur lors de l'ajout d'un arrêt"
      };
    }
  }
}

export const bookingService = new BookingService();
export default bookingService;
