import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

export type AdminRpcResult = {
  success?: boolean;
  error?: string;
  message?: string;
  new_status?: string;
};

const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

/**
 * createBrowserClient RPC Args inference is broken under our TS/supabase versions
 * (second arg typed as undefined). Call through this helper with explicit casts.
 */
async function callAdminRpc(
  fn: "admin_cancel_ride" | "admin_reassign_ride" | "validate_driver_dossier",
  args: Record<string, unknown>,
): Promise<AdminRpcResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    fn as never,
    args as never,
  );
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (row && typeof row === "object") {
    return row as AdminRpcResult;
  }
  return {};
}

export function isAdminRpcFailure(
  result: AdminRpcResult | null | undefined,
): result is AdminRpcResult & { success: false } {
  return result?.success === false;
}

export async function adminCancelRide(
  rideId: string,
  reason?: string,
): Promise<AdminRpcResult> {
  return callAdminRpc("admin_cancel_ride", {
    p_ride_id: rideId,
    ...(reason ? { p_reason: reason } : {}),
  });
}

export async function adminReassignRide(
  rideId: string,
  driverId: string,
): Promise<AdminRpcResult> {
  return callAdminRpc("admin_reassign_ride", {
    p_ride_id: rideId,
    p_driver_id: driverId,
  });
}

export async function validateDriverDossier(
  driverId: string,
  adminUserId: string,
  approved: boolean,
  rejectionReason?: string | null,
): Promise<AdminRpcResult> {
  return callAdminRpc("validate_driver_dossier", {
    p_driver_id: driverId,
    p_admin_user_id: adminUserId,
    p_approved: approved,
    ...(rejectionReason != null
      ? { p_rejection_reason: rejectionReason }
      : {}),
  });
}
