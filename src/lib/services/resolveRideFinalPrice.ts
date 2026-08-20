import { supabase } from "@/lib/database/client";
import type { VehicleType } from "@/lib/vehicle";

interface ResolveFinalPriceInput {
  rideId: string;
  vehicleType: VehicleType;
  pickupLat: number;
  pickupLon: number;
  dropoffLat: number;
  dropoffLon: number;
  options: string[];
  distance: number | null;
  duration: number | null;
  fallbackPrice: number | null;
}

/**
 * Prefer server-side price-calculator Edge Function; fall back to the client
 * estimate when the function is unavailable locally (edge runtime stopped).
 */
export async function resolveRideFinalPrice(
  input: ResolveFinalPriceInput,
): Promise<number | null> {
  const {
    rideId,
    vehicleType,
    pickupLat,
    pickupLon,
    dropoffLat,
    dropoffLon,
    options,
    distance,
    duration,
    fallbackPrice,
  } = input;

  try {
    // Do not override Authorization: supabase-js already sends the session JWT
    // (or anon key). Forcing a custom Bearer can 401 against the local gateway
    // when signing keys differ from NEXT_PUBLIC_SUPABASE_ANON_KEY.
    const { data: edgeResult, error: edgeError } =
      await supabase.functions.invoke("price-calculator", {
        body: {
          new: {
            id: rideId,
            vehicle_type: vehicleType,
            pickup_lat: pickupLat,
            pickup_lon: pickupLon,
            dropoff_lat: dropoffLat,
            dropoff_lon: dropoffLon,
            options,
            distance,
            duration,
          },
        },
      });

    if (!edgeError) {
      const { data: refreshedRide } = await supabase
        .from("rides")
        .select("final_price")
        .eq("id", rideId)
        .maybeSingle();
      if (refreshedRide?.final_price != null) {
        console.info(
          "[resolveRideFinalPrice] Edge function OK — final_price=",
          refreshedRide.final_price,
          edgeResult,
        );
        return refreshedRide.final_price;
      }
      console.warn(
        "[resolveRideFinalPrice] Edge function responded but final_price still null",
        edgeResult,
      );
    } else {
      console.warn(
        "[resolveRideFinalPrice] Edge function unavailable, using local estimate:",
        edgeError.message,
      );
    }
  } catch (err) {
    console.warn("[resolveRideFinalPrice] Edge function call failed:", err);
  }

  if (fallbackPrice == null) return null;

  const { error: updateError } = await supabase
    .from("rides")
    .update({ final_price: fallbackPrice })
    .eq("id", rideId);

  if (updateError) {
    console.warn(
      "[resolveRideFinalPrice] Could not persist fallback final_price:",
      updateError.message,
    );
    return fallbackPrice;
  }

  return fallbackPrice;
}
