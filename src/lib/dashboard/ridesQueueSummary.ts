import { supabase } from "@/lib/database/client";
import { overdueUnassignedOrFilter } from "@/lib/dashboard/adminDashboard";

export type QueuePreview = {
  count: number;
  pickupTime: string | null;
};

export const EMPTY_QUEUE_PREVIEW: QueuePreview = {
  count: 0,
  pickupTime: null,
};

/**
 * The two numbers the courses header shows for each queue.
 *
 * PostgREST reports the total on `count: "exact"` alongside the rows it returns, so the count
 * and the earliest pickup time come from the **same** round-trip. The previous shape sent two
 * queries per card — a `head: true` count plus an ordered select — spending four requests on
 * two numbers, all of them on the critical path of the page's first paint.
 *
 * Only `pickup_time` is selected: that is the field the card renders, not the whole ride.
 *
 * Kept out of the component so the request shape can be asserted directly. A regression here
 * is invisible in the UI — the numbers stay correct — and shows up only as latency, which no
 * screenshot would catch.
 */
export async function loadUpcomingQueue(): Promise<QueuePreview> {
  const { data, count } = await supabase
    .from("rides")
    .select("pickup_time", { count: "exact" })
    .eq("status", "pending")
    .gte("pickup_time", new Date().toISOString())
    .order("pickup_time", { ascending: true })
    .limit(1);

  return {
    count: count ?? 0,
    pickupTime: data?.[0]?.pickup_time ?? null,
  };
}

export async function loadDelayedQueue(): Promise<QueuePreview> {
  const { data, count } = await supabase
    .from("rides")
    .select("pickup_time", { count: "exact" })
    .or(overdueUnassignedOrFilter(new Date().toISOString()))
    .order("pickup_time", { ascending: true })
    .limit(1);

  return {
    count: count ?? 0,
    pickupTime: data?.[0]?.pickup_time ?? null,
  };
}
