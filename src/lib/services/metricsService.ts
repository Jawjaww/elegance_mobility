import { getDashboardMetrics as getDashboardMetricsInternal } from "./dashboard";
import type { DashboardMetrics } from "./dashboard";

export class MetricsService {
  static async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      return await getDashboardMetricsInternal();
    } catch (error) {
      console.error("Erreur lors de la récupération des métriques:", error);
      throw error;
    }
  }
}

export default MetricsService;

export type { DashboardMetrics } from "./dashboard";
