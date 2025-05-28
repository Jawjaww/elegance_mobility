'use server'

import { MetricsService } from "@/lib/services/metricsService"
import { AdminDashboardClient } from "@/components/admin/AdminDashboardClient"
import { redirect } from "next/navigation"
import { getServerUser } from "@/lib/database/server"
import { User } from "@/lib/types/common.types"
import { isAdmin } from "@/lib/types/common.types"

export const revalidate = 0

/**
 * Page d'accueil du backoffice
 * La vérification des rôles est déjà faite dans le layout
 */
export default async function BackofficeIndexPage() {
  const user = await getServerUser()
  if (!user) {
    redirect("/auth/login?redirectTo=/backoffice-portal/dashboard")
  }
  
  const metrics = await MetricsService.getDashboardMetrics()

  return (
    <div className="container mx-auto py-8">
      <AdminDashboardClient
        initialMetrics={metrics}
        user={user}
        isAdmin={isAdmin(user)}
      />
    </div>
  )
}
