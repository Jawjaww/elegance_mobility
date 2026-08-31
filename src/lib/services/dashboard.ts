import { supabase } from "@/lib/database/client";

export interface DashboardMetrics {
  todayRides: number;
  pendingRides: number;
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

  const [
    todayRidesResult,
    pendingRidesResult,
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
      .eq("status", "pending"),

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
