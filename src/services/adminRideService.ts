import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

export async function adminCancelRide(rideId: string, reason?: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_cancel_ride", {
    p_ride_id: rideId,
    p_reason: reason ?? null,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function adminReassignRide(rideId: string, driverId: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_reassign_ride", {
    p_ride_id: rideId,
    p_driver_id: driverId,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function validateDriverDossier(
  driverId: string,
  adminUserId: string,
  approved: boolean,
  rejectionReason?: string | null,
) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("validate_driver_dossier", {
    p_driver_id: driverId,
    p_admin_user_id: adminUserId,
    p_approved: approved,
    p_rejection_reason: rejectionReason ?? null,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}
