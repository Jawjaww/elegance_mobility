import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";
import { isRideStillOfferable } from "@/lib/utils/ridePickup";
import {
  isOpenRideOffer,
  shouldDropOverlayForOfferStatus,
  type RideOfferRealtimeRow,
} from "./offerRealtime";

type DbRide = Database["public"]["Tables"]["rides"]["Row"];

import type { Ride } from "./types";
import { acceptRide as clientAcceptRide } from "@/services/rideService";

export type PendingRide = Ride;

export interface AcceptRideResult {
  success: boolean;
  error?: string;
  rideId?: string;
  status?: string;
}

class DriverRideService {
  private subscription: ReturnType<typeof supabase.channel> | null = null;
  private subscribeGen = 0;

  subscribeToPendingRides(
    onNewRide: (ride: PendingRide) => void,
    onRideUpdated: (ride: PendingRide) => void,
    onRideRemoved: (rideId: string) => void,
  ) {
    this.unsubscribe();
    const gen = ++this.subscribeGen;
    void this.bindPendingRideChannel(
      gen,
      onNewRide,
      onRideUpdated,
      onRideRemoved,
    );
    return this.subscription;
  }

  private async bindPendingRideChannel(
    gen: number,
    onNewRide: (ride: PendingRide) => void,
    onRideUpdated: (ride: PendingRide) => void,
    onRideRemoved: (rideId: string) => void,
  ) {
    const driverId = await this.resolveDriverId();
    const handleOfferRow = (row: RideOfferRealtimeRow) => {
      if (isOpenRideOffer(row)) {
        void this.fetchRideById(row.ride_id).then((ride) => {
          if (ride) onNewRide(ride);
        });
        return;
      }
      if (shouldDropOverlayForOfferStatus(row.status)) {
        onRideRemoved(row.ride_id);
      }
    };

    let channel = supabase.channel(
      driverId ? `driver-matching:${driverId}` : "driver-pending-rides",
    );
    channel = channel
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rides",
        },
        (payload) => {
          const ride = payload.new as DbRide;
          if (!isRideStillOfferable(ride)) return;
          onNewRide(this.mapToPendingRide(ride));
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
        },
        (payload) => {
          const ride = payload.new as DbRide;
          if (!isRideStillOfferable(ride)) {
            onRideRemoved(ride.id);
            return;
          }
          onRideUpdated(this.mapToPendingRide(ride));
        },
      );
    if (driverId) {
      const offerFilter = `driver_id=eq.${driverId}` as const;
      channel = channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "ride_offers",
            filter: offerFilter,
          },
          (payload) => {
            handleOfferRow(payload.new as RideOfferRealtimeRow);
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "ride_offers",
            filter: offerFilter,
          },
          (payload) => {
            handleOfferRow(payload.new as RideOfferRealtimeRow);
          },
        );
    }

    if (gen !== this.subscribeGen) return;

    this.subscription = channel.subscribe((status) => {
      console.log("[DriverRideService] Subscription status:", status);
    });
  }

  private async resolveDriverId(): Promise<string | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("drivers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    return data?.id ?? null;
  }

  async fetchRideById(rideId: string): Promise<PendingRide | null> {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .maybeSingle();
    if (error || !data) return null;
    if (!isRideStillOfferable(data)) return null;
    return this.mapToPendingRide(data);
  }

  unsubscribe() {
    this.subscribeGen += 1;
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  async fetchPendingRides(): Promise<PendingRide[]> {
    const { data, error } = await supabase
      .from("rides")
      .select("*")
      .in("status", ["pending", "delayed"])
      .is("matching_paused_at", null)
      .or(
        `matching_deadline_at.gt.${new Date().toISOString()},matching_deadline_at.is.null`,
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      console.error("[DriverRideService] Error fetching pending rides:", error);
      throw error;
    }

    return (data || [])
      .filter((ride) => isRideStillOfferable(ride))
      .map((ride) => this.mapToPendingRide(ride));
  }

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

  async respondOffer(rideId: string, response: "declined" | "timeout") {
    const { error } = await supabase.rpc("respond_ride_offer", {
      p_ride_id: rideId,
      p_response: response,
    });
    if (error) console.warn("[DriverRideService] respond_ride_offer", error);
  }

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
      clientIncentive: Number(
        (ride as DbRide & { client_incentive?: number }).client_incentive ?? 0,
      ),
      status: ride.status,
      options: ride.options || [],
      createdAt: ride.created_at,
      driverArrivedAt: ride.driver_arrived_at ?? null,
    };
  }

  async markDriverArrived(rideId: string) {
    const { data, error } = await supabase.rpc("mark_driver_arrived", {
      p_ride_id: rideId,
    });
    if (error) return { success: false as const, error: error.message };
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.success !== true) {
      return {
        success: false as const,
        error: (row?.error as string) || "arrival failed",
      };
    }
    return {
      success: true as const,
      driverArrivedAt: (row.driver_arrived_at as string | null) ?? null,
      alreadyMarked: row.already_marked === true,
    };
  }

  async updateRideProgress(
    rideId: string,
    status: "in-progress" | "completed" | "driver-canceled" | "no-show",
  ) {
    const { data, error } = await supabase.rpc("update_ride_progress", {
      p_ride_id: rideId,
      p_status: status,
    });
    if (error) return { success: false as const, error: error.message };
    const row = Array.isArray(data) ? data[0] : data;
    if (row?.success !== true) {
      return {
        success: false as const,
        error: (row?.error as string) || "progress failed",
      };
    }
    return { success: true as const, status: row.status as string };
  }
}

export const driverRideService = new DriverRideService();
