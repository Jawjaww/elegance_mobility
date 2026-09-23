import { supabase } from "@/lib/database/client";
import { overdueUnassignedOrFilter } from "@/lib/dashboard/adminDashboard";

export type QueuePreview = {
  count: number;
  pickupTime: string | null;
  /**
   * True when the request itself failed.
   *
   * Without this, a failed request and an empty queue were indistinguishable: PostgREST
   * returns `count: null` on failure, which `?? 0` turned into a confident "0 / Aucune".
   * The operator read "nothing is waiting" where the truth was "we could not find out" —
   * and the delayed queue is precisely the one where that wrong answer is expensive.
   */
  failed: boolean;
};

export const EMPTY_QUEUE_PREVIEW: QueuePreview = {
  count: 0,
  pickupTime: null,
  failed: false,
};

export const FAILED_QUEUE_PREVIEW: QueuePreview = {
  count: 0,
  pickupTime: null,
  failed: true,
};

/** Minimal shape of the PostgREST response this module reads. */
export type QueueResponse = {
  data: Array<{ pickup_time: string | null }> | null;
  count: number | null;
  error: unknown;
};

/**
 * Maps a PostgREST response to a preview, keeping failure distinct from emptiness.
 *
 * Exported so the distinction can be asserted directly: the UI difference between the two
 * states is one word, which no screenshot would catch.
 */
export function toQueuePreview(response: QueueResponse): QueuePreview {
  if (response.error) return FAILED_QUEUE_PREVIEW;

  return {
    count: response.count ?? 0,
    pickupTime: response.data?.[0]?.pickup_time ?? null,
    failed: false,
  };
}

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
  const response = await supabase
    .from("rides")
    .select("pickup_time", { count: "exact" })
    .eq("status", "pending")
    .gte("pickup_time", new Date().toISOString())
    .order("pickup_time", { ascending: true })
    .limit(1);

  return toQueuePreview(response);
}

export async function loadDelayedQueue(): Promise<QueuePreview> {
  const response = await supabase
    .from("rides")
    .select("pickup_time", { count: "exact" })
    .or(overdueUnassignedOrFilter(new Date().toISOString()))
    .order("pickup_time", { ascending: true })
    .limit(1);

  return toQueuePreview(response);
}
