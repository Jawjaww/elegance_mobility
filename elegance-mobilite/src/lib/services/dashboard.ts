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
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString();
  const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString();
  
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString();

  // Utiliser le client navigateur Supabase singleton
  const [
    todayRidesResult,
    pendingRidesResult,
    activeDriversResult,
    remainingRidesResult,
    availableVehiclesResult,
    yesterdayRidesResult,
  ] = await Promise.all([
    // Courses d'aujourd'hui - filtre sur pickup_time
    supabase
      .from("rides")
      .select("*", { count: "exact" })
      .gte("pickup_time", todayStr)
      .lt("pickup_time", tomorrowStr),

    supabase
      .from("rides")
      .select("*", { count: "exact" })
      .eq("status", "pending"),

    // Chauffeurs actifs - utilise table drivers
    supabase
      .from("drivers")
      .select("*", { count: "exact" })
      .eq("status", "active"),

    // Courses futures (après aujourd'hui)
    supabase
      .from("rides")
      .select("*", { count: "exact" })
      .gte("pickup_time", tomorrowStr),

    // Véhicules (tous) - table vehicles n'a pas de colonne status
    supabase
      .from("vehicles")
      .select("*", { count: "exact" }),

    // Courses d'hier
    supabase
      .from("rides")
      .select("*", { count: "exact" })
      .gte("pickup_time", yesterdayStr)
      .lt("pickup_time", todayStr),
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
