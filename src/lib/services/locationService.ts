/**
 * Driver GPS sync via update_driver_location RPC.
 * Resolves drivers.id server-side (never write auth.uid() as driver_id).
 */
import type { SupabaseClient } from '@supabase/supabase-js'

export type DriverLocationPayload = {
  lat: number
  lng: number
  heading?: number | null
  speed?: number | null
  accuracy?: number | null
}

export async function pushDriverLocation(
  supabase: SupabaseClient,
  location: DriverLocationPayload
) {
  return supabase.rpc('update_driver_location', {
    p_lat: location.lat,
    p_lng: location.lng,
    p_heading: location.heading ?? undefined,
    p_speed: location.speed ?? undefined,
    p_accuracy: location.accuracy ?? undefined,
  })
}
