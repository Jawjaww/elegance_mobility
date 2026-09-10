import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

export type ConfirmMatchingResult = {
  success?: boolean;
  error?: string;
  ride_id?: string;
  matching_deadline_at?: string;
  matching_paused_at?: string | null;
};

const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

export async function confirmRideMatching(
  rideId: string,
): Promise<ConfirmMatchingResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "confirm_ride_matching" as never,
    {
      p_ride_id: rideId,
    } as never,
  );
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (row && typeof row === "object") {
    return row as ConfirmMatchingResult;
  }
  return {};
}

export function isConfirmMatchingFailure(
  result: ConfirmMatchingResult | null | undefined,
): result is ConfirmMatchingResult & { success: false } {
  return result?.success === false;
}
