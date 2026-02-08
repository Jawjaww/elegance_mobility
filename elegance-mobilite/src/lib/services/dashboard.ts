import { supabase } from "@/lib/database/client";
// import type { Database } from "@/lib/types/database.types";

export interface DashboardMetrics {
  todayRides: number;
  pendingRides: number;
  activeDrivers: number;
  remainingRides: number;
  availableVehicles: number;
  todayRidesTrend: {
    percentage: number;
    isUp: boolean;
  };
}

/**
 * Récupère les métriques pour le tableau de bord administrateur
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  // Utiliser le client navigateur Supabase singleton
  const [
    todayRidesResult,
    pendingRidesResult,
    activeDriversResult,
    remainingRidesResult,
    availableVehiclesResult,
    yesterdayRidesResult,
  ] = await Promise.all([
    supabase.from("rides").select("*", { count: "exact" }).eq("date", today),

    supabase
      .from("rides")
      .select("*", { count: "exact" })
      .eq("status", "pending"),

    supabase
      .from("users")
      .select("*", { count: "exact" })
      .eq("role", "driver")
      .eq("status", "active"),

    supabase.from("rides").select("*", { count: "exact" }).gt("date", today),

    supabase
      .from("vehicles")
      .select("*", { count: "exact" })
      .eq("status", "available"),

    supabase
      .from("rides")
      .select("*", { count: "exact" })
      .eq("date", yesterdayStr),
  ]);

  const todayRidesCount = todayRidesResult.count || 0;
  const yesterdayRidesCount = yesterdayRidesResult.count || 0;

  // Calculer la tendance
  const trendPercentage = yesterdayRidesCount
    ? ((todayRidesCount - yesterdayRidesCount) / yesterdayRidesCount) * 100
    : 0;

  return {
    todayRides: todayRidesCount,
    pendingRides: pendingRidesResult.count || 0,
    activeDrivers: activeDriversResult.count || 0,
    remainingRides: remainingRidesResult.count || 0,
    availableVehicles: availableVehiclesResult.count || 0,
    todayRidesTrend: {
      percentage: Math.abs(trendPercentage),
      isUp: trendPercentage >= 0,
    },
  };
}
