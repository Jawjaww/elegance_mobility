import { MetricsService } from "@/lib/services/metricsService"
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient"

export const revalidate = 0

/**
 * Page d'accueil du backoffice (redirige vers dashboard)
 * La protection est gérée par le middleware
 */
export default async function BackofficeIndexPage() {
  const metrics = await MetricsService.getDashboardMetrics()

  return (
    <div className="container mx-auto py-8">
      <AdminDashboardClient
        initialMetrics={metrics}
      />
    </div>
  )
}
