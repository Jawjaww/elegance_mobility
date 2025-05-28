'use server'

import { getDashboardMetrics } from "@/lib/services/dashboard"
import { AdminCardGrid } from "@/components/admin/admin-card-grid"
import { DashboardActionCard } from "@/components/admin/dashboard-action-card"
import { DashboardMetricCard } from "@/components/admin/dashboard-metric-card"
import { Car, CalendarCheck, MapPin, Users, CreditCard, PackageOpen } from "lucide-react"

// Force le mode dynamique pour éviter la mise en cache
export const revalidate = 0

export default async function AdminDashboard() {
  const metrics = await getDashboardMetrics()

  return (
    <>
      {/* Carte principale des courses d'aujourd'hui */}
      <AdminCardGrid columns={{ default: 1 }}>
        <DashboardMetricCard
          title="Courses aujourd'hui"
          value={metrics.todayRides.toString()}
          icon={<MapPin className="h-4 w-4" />}
          trend={`${metrics.todayRidesTrend.percentage.toFixed(0)}%`}
          trendUp={metrics.todayRidesTrend.isUp}
          href="/backoffice-portal/rides/today"
          className="bg-blue-950/90 border-blue-500/20 hover:border-blue-500/30 hover:bg-blue-950/95"
        />
      </AdminCardGrid>

      {/* Métriques */}
      <AdminCardGrid className="mt-6" columns={{
        default: 2,
        sm: 2,
        md: 2,
        lg: 4,
        xl: 4,
      }}>
        <DashboardMetricCard
          title="Courses non attribuées"
          value={metrics.pendingRides.toString()}
          icon={<MapPin className="h-4 w-4" />}
          href="/backoffice-portal/rides/pending"
        />
        <DashboardMetricCard
          title="Chauffeurs actifs"
          value={metrics.activeDrivers.toString()}
          icon={<Users className="h-4 w-4" />}
          href="/backoffice-portal/drivers"
        />
        <DashboardMetricCard
          title="Courses restantes"
          value={metrics.remainingRides.toString()}
          icon={<CalendarCheck className="h-4 w-4" />}
          href="/backoffice-portal/rides/remaining"
        />
        <DashboardMetricCard
          title="Véhicules disponibles"
          value={metrics.availableVehicles.toString()}
          icon={<Car className="h-4 w-4" />}
          href="/backoffice-portal/vehicles"
        />
      </AdminCardGrid>

      {/* Actions rapides */}
      <AdminCardGrid className="mt-6" columns={{
        default: 1,
        sm: 2,
        md: 2,
        lg: 2,
      }}>
        <DashboardActionCard
          title="Tarifs kilométriques"
          description="Gérer les tarifs de base et kilométriques"
          href="/backoffice-portal/rates"
          icon={<CreditCard className="h-4 w-4" />}
          iconColor="text-blue-500"
        />
        <DashboardActionCard
          title="Options et services"
          description="Configurer les options additionnelles"
          href="/backoffice-portal/options"
          icon={<PackageOpen className="h-4 w-4" />}
          iconColor="text-green-500"
        />
      </AdminCardGrid>
    </>
  )
}
