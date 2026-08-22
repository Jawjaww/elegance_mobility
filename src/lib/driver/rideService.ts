import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";
import {
  isRidePickupStillOfferable,
  ridePickupExpiryCutoffIso,
} from "@/lib/utils/ridePickup";

type DbRide = Database["public"]["Tables"]["rides"]["Row"];

import type { Ride } from "./types";
import { acceptRide as clientAcceptRide } from "@/services/rideService";

// Re-export du type Ride pour compatibilité
export type PendingRide = Ride;

export interface AcceptRideResult {
  success: boolean;
  error?: string;
  rideId?: string;
  status?: string;
}

/**
 * Service pour gérer les courses côté chauffeur
 */
class DriverRideService {
  private subscription: ReturnType<typeof supabase.channel> | null = null;

  /**
   * S'abonner aux nouvelles courses en attente
   */
  subscribeToPendingRides(
    onNewRide: (ride: PendingRide) => void,
    onRideUpdated: (ride: PendingRide) => void,
    onRideRemoved: (rideId: string) => void,
  ) {
    // Nettoyer l'ancienne subscription si existe
    this.unsubscribe();

    this.subscription = supabase
      .channel("driver-pending-rides")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rides",
          filter: "status=eq.pending",
        },
        (payload) => {
          const ride = payload.new as DbRide;
          if (!isRidePickupStillOfferable(ride.pickup_time)) return;
          onNewRide(this.mapToPendingRide(ride));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: "status=eq.pending",
        },
        (payload) => {
          const ride = payload.new as DbRide;
          if (!isRidePickupStillOfferable(ride.pickup_time)) {
            onRideRemoved(ride.id);
            return;
          }
          onRideUpdated(this.mapToPendingRide(ride));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: "status=neq.pending",
        },
        (payload) => {
          // Une course n'est plus pending (acceptée ou annulée)
          onRideRemoved((payload.new as DbRide).id);
        },
      )
      .subscribe((status) => {
        console.log("[DriverRideService] Subscription status:", status);
      });

    return this.subscription;
  }

  /**
   * Se désabonner des courses
   */
  unsubscribe() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  /**
   * Récupérer les courses en attente actuelles
   */
  async fetchPendingRides(): Promise<PendingRide[]> {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("status", "pending")
      .gt("pickup_time", ridePickupExpiryCutoffIso())
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[DriverRideService] Error fetching pending rides:", error);
      throw error;
    }

    return (data || []).map(this.mapToPendingRide);
  }

  /**
   * Accepter une course via l'API
   */
  async acceptRide(rideId: string): Promise<AcceptRideResult> {
    try {
      const rpcResult: any = await clientAcceptRide(rideId);

      if (!rpcResult) {
        return { success: false, error: "Aucune réponse du serveur" };
      }

      if (rpcResult.success === false) {
        return {
          success: false,
          error: rpcResult.error || "Rejet de la course",
        };
      }

      return {
        success: true,
        rideId: rpcResult.ride_id ?? rideId,
        status: rpcResult.status ?? "scheduled",
      };
    } catch (error) {
      console.error("[DriverRideService] Error accepting ride:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Erreur réseau",
      };
    }
  }

  async recordOffer(rideId: string) {
    const { error } = await supabase.rpc("record_ride_offer", {
      p_ride_id: rideId,
    });
    if (error) console.warn("[DriverRideService] record_ride_offer", error);
  }

  async respondOffer(rideId: string, response: "declined" | "timeout") {
    const { error } = await supabase.rpc("respond_ride_offer", {
      p_ride_id: rideId,
      p_response: response,
    });
    if (error) console.warn("[DriverRideService] respond_ride_offer", error);
  }

  /**
   * Mapper une ride DB vers Ride
   */
  private mapToPendingRide(ride: DbRide): Ride {
    return {
      id: ride.id,
      clientId: ride.user_id || "",
      pickupLocation: ride.pickup_address,
      dropoffLocation: ride.dropoff_address,
      pickupLat: ride.pickup_lat ?? 0,
      pickupLng: ride.pickup_lon ?? 0,
      dropoffLat: ride.dropoff_lat ?? 0,
      dropoffLng: ride.dropoff_lon ?? 0,
      pickupTime: ride.pickup_time,
      vehicleType: ride.vehicle_type,
      estimatedDistance: ride.distance,
      estimatedDuration: ride.duration,
      estimatedPrice: ride.estimated_price,
      finalPrice: ride.final_price,
      status: ride.status,
      options: ride.options || [],
      createdAt: ride.created_at,
    };
  }
}

export const driverRideService = new DriverRideService();
