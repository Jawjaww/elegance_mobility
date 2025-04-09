import { createServerSupabaseClient } from "@/lib/database/server";
import type { DashboardMetrics } from "./dashboard";

export class MetricsService {
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      const supabase = await createServerSupabaseClient();
      
      const today = new Date().toISOString().split('T')[0];
      const [
        todayRidesResult,
        pendingRidesResult,
        activeDriversResult,
        remainingRidesResult,
        availableVehiclesResult
      ] = await Promise.all([
        // Courses d'aujourd'hui
        supabase
          .from('rides')
          .select('count', { count: 'exact' })
          .gte('pickup_time', today),

        // Courses non attribuées
        supabase
          .from('rides')
          .select('count', { count: 'exact' })
          .eq('status', 'pending'),

        // Chauffeurs actifs
        supabase
          .from('drivers')
          .select('count', { count: 'exact' })
          .eq('status', 'active'),

        // Courses restantes
        supabase
          .from('rides')
          .select('count', { count: 'exact' })
          .in('status', ['pending', 'confirmed']),

        // Véhicules disponibles
        supabase
          .from('vehicles')
          .select('count', { count: 'exact' })
          .eq('status', 'available'),
      ]);

      return {
        todayRides: todayRidesResult.count || 0,
        todayRidesTrend: {
          percentage: 0,
          isUp: true
        },
        pendingRides: pendingRidesResult.count || 0,
        activeDrivers: activeDriversResult.count || 0,
        remainingRides: remainingRidesResult.count || 0,
        availableVehicles: availableVehiclesResult.count || 0
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des métriques:', error);
      throw error;
    }
  }
}

export default MetricsService;