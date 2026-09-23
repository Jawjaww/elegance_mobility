import { supabase } from "@/lib/database/client";
import { overdueUnassignedOrFilter } from "@/lib/dashboard/adminDashboard";

export interface DashboardMetrics {
  todayRides: number;
  pendingRides: number;
  delayedRides: number;
  inProgressRides: number;
  activeDrivers: number;
  onlineDrivers: number;
  remainingRides: number;
  availableVehicles: number;
  todayRidesTrend: {
    percentage: number;
    isUp: boolean;
  };
}

/**
 * Collects the label of a count whose request failed.
 *
 * Every count used to be read with `.count || 0`, which conflates "we counted zero" with "we
 * could not count at all". A failed `rides` request therefore rendered as a confident
 * "0 course en retard" while the rides list showed two, and nothing said the number was
 * unavailable — `getDashboardMetrics` never throws, so the caller's error toast never fired.
 *
 * A count nobody could obtain is not zero. The failure is named here and thrown below.
 */
function collectCountFailure(
  failures: string[],
  label: string,
  result: { error: { message: string } | null },
): void {
  if (result.error) failures.push(`${label} : ${result.error.message}`);
}

/**
 * Fetches metrics for the admin dashboard.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  const tomorrowStr = new Date(
    today.getTime() + 24 * 60 * 60 * 1000,
  ).toISOString();

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString();
  const nowIso = new Date().toISOString();

  const [
    todayRidesResult,
    pendingRidesResult,
    delayedRidesResult,
    inProgressRidesResult,
    activeDriversResult,
    onlineDriversResult,
    remainingRidesResult,
    availableVehiclesResult,
    yesterdayRidesResult,
  ] = await Promise.all([
    supabase
      .from("rides")
      .select("id", { count: "exact", head: true })
      .gte("pickup_time", todayStr)
      .lt("pickup_time", tomorrowStr),

    supabase
      .from("rides")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gte("pickup_time", nowIso),

    supabase
      .from("rides")
      .select("id", { count: "exact", head: true })
      .or(overdueUnassignedOrFilter(nowIso)),

    supabase
      .from("rides")
      .select("id", { count: "exact", head: true })
      .eq("status", "in-progress"),

    supabase
      .from("drivers")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),

    supabase
      .from("driver_locations")
      .select("driver_id", { count: "exact", head: true })
      .eq("is_online", true),

    supabase
      .from("rides")
      .select("id", { count: "exact", head: true })
      .gte("pickup_time", tomorrowStr),

    supabase.from("vehicles").select("id", { count: "exact", head: true }),

    supabase
      .from("rides")
      .select("id", { count: "exact", head: true })
      .gte("pickup_time", yesterdayStr)
      .lt("pickup_time", todayStr),
  ]);

  // `vehicles` keeps its deliberate soft failure: a missing vehicle count degrades one metric
  // card and was already handled as such. The ride and driver counts below are the numbers the
  // operator acts on, so they must not be guessed.
  const failedCounts: string[] = [];
  collectCountFailure(failedCounts, "courses du jour", todayRidesResult);
  collectCountFailure(failedCounts, "courses en attente", pendingRidesResult);
  collectCountFailure(failedCounts, "courses en retard", delayedRidesResult);
  collectCountFailure(failedCounts, "courses en cours", inProgressRidesResult);
  collectCountFailure(failedCounts, "chauffeurs actifs", activeDriversResult);
  collectCountFailure(
    failedCounts,
    "chauffeurs en ligne",
    onlineDriversResult,
  );
  collectCountFailure(failedCounts, "courses à venir", remainingRidesResult);

  if (failedCounts.length > 0) {
    throw new Error(`Compteurs indisponibles — ${failedCounts.join(" ; ")}`);
  }

  if (availableVehiclesResult.error) {
    console.warn(
      "[dashboard] vehicles count failed:",
      availableVehiclesResult.error.message,
    );
  }

  const todayRidesCount = todayRidesResult.count || 0;
  const yesterdayRidesCount = yesterdayRidesResult.count || 0;

  const trendPercentage = yesterdayRidesCount
    ? ((todayRidesCount - yesterdayRidesCount) / yesterdayRidesCount) * 100
    : 0;

  return {
    todayRides: todayRidesCount,
    pendingRides: pendingRidesResult.count || 0,
    delayedRides: delayedRidesResult.count || 0,
    inProgressRides: inProgressRidesResult.count || 0,
    activeDrivers: activeDriversResult.count || 0,
    onlineDrivers: onlineDriversResult.count || 0,
    remainingRides: remainingRidesResult.count || 0,
    availableVehicles: availableVehiclesResult.error
      ? 0
      : availableVehiclesResult.count || 0,
    todayRidesTrend: {
      percentage: Math.abs(trendPercentage),
      isUp: trendPercentage >= 0,
    },
  };
}
