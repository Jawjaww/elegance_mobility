import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";

export type AddIncentiveResult = {
  success?: boolean;
  error?: string;
  ride_id?: string;
  client_incentive?: number;
  matching_deadline_at?: string;
  matching_paused_at?: string | null;
};

const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );

export async function addRideIncentive(
  rideId: string,
  amount: number,
): Promise<AddIncentiveResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc(
    "add_ride_incentive" as never,
    {
      p_ride_id: rideId,
      p_amount: amount,
    } as never,
  );
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (row && typeof row === "object") {
    return row as AddIncentiveResult;
  }
  return {};
}

export function isAddIncentiveFailure(
  result: AddIncentiveResult | null | undefined,
): result is AddIncentiveResult & { success: false } {
  return result?.success === false;
}
