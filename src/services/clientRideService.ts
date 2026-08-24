import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

export type ClientCancelResult = {
  success?: boolean;
  error?: string;
  status?: string;
  ride_id?: string;
  canceled_by?: string;
  cancellation_reason?: string;
};

const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

/**
 * createBrowserClient RPC Args inference is broken under our TS/supabase versions.
 * Call through explicit casts like adminRideService.
 */
export async function clientCancelRide(
  rideId: string,
  reason?: string,
): Promise<ClientCancelResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "client_cancel_ride" as never,
    {
      p_ride_id: rideId,
      ...(reason ? { p_reason: reason } : {}),
    } as never,
  );
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (row && typeof row === "object") {
    return row as ClientCancelResult;
  }
  return {};
}

export function isClientCancelFailure(
  result: ClientCancelResult | null | undefined,
): result is ClientCancelResult & { success: false } {
  return result?.success === false;
}
