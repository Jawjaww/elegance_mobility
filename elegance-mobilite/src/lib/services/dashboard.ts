import { createServerSupabaseClient } from "@/lib/database/server";
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

  // S'assurer que le client est initialisé avant de l'utiliser
  const supabase = await createServerSupabaseClient();
  
  // Récupérer toutes les métriques en parallèle
  const [
    todayRidesResult,
    pendingRidesResult,
    activeDriversResult,
    remainingRidesResult,
    availableVehiclesResult,
    yesterdayRidesResult
  ] = await Promise.all([
    (await supabase)
      .from("rides")
      .select("*", { count: "exact" })
      .eq("date", today),

    (await supabase)
      .from("rides")
      .select("*", { count: "exact" })
      .eq("status", "pending"),

    (await supabase)
      .from("users")
      .select("*", { count: "exact" })
      .eq("role", "driver")
      .eq("status", "active"),

    (await supabase)
      .from("rides")
      .select("*", { count: "exact" })
      .gt("date", today),

    (await supabase)
      .from("vehicles")
      .select("*", { count: "exact" })
      .eq("status", "available"),

    (await supabase)
      .from("rides")
      .select("*", { count: "exact" })
      .eq("date", yesterdayStr)
  ]);

  const todayRidesCount = todayRidesResult.count || 0;
  const yesterdayRidesCount = yesterdayRidesResult.count || 0;

  // Calculer la tendance
  const trendPercentage = yesterdayRidesCount ? 
    ((todayRidesCount - yesterdayRidesCount) / yesterdayRidesCount * 100) : 
    0;

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
