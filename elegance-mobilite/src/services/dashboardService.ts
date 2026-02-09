import { getDashboardMetrics as getDashboardMetricsInternal } from "@/lib/services/dashboard";
export type { DashboardMetrics } from "@/lib/services/dashboard";

/**
 * Client-facing wrapper for dashboard metrics.
 * Use this in client components instead of calling a server API route.
 */
export async function getDashboardMetrics() {
  return getDashboardMetricsInternal();
}

export default { getDashboardMetrics };
