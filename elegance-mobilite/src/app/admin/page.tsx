"use client"

import { useEffect, useState } from "react"
import { AdminCardGrid } from "@/components/admin/admin-card-grid"
import { Car, CalendarCheck, MapPin, Users, CreditCard, PackageOpen } from "lucide-react"
import { DashboardActionCard } from "@/components/admin/dashboard-action-card"
import { DashboardMetricCard } from "@/components/admin/dashboard-metric-card"
import { getDashboardMetrics, type DashboardMetrics } from "@/lib/services/dashboard"

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    todayRides: 0,
    pendingRides: 0,
    activeDrivers: 0,
    remainingRides: 0,
    availableVehicles: 0,
    todayRidesTrend: {
      percentage: 0,
      isUp: true
    }
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await getDashboardMetrics()
        setMetrics(data)
      } catch (error) {
        console.error("Erreur lors de la récupération des métriques:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  return (
    <>
      {/* Carte principale des courses d'aujourd'hui */}
      <AdminCardGrid columns={{ default: 1 }}>
        <DashboardMetricCard
          title="Courses aujourd'hui"
          value={isLoading ? "..." : metrics.todayRides.toString()}
          icon={<MapPin className="h-4 w-4" />}
          trend={isLoading ? undefined : `${metrics.todayRidesTrend.percentage.toFixed(0)}%`}
          trendUp={metrics.todayRidesTrend.isUp}
          href="/admin/rides/today"
          className="bg-blue-950/90 border-blue-500/20 hover:border-blue-500/30 hover:bg-blue-950/95"
        />
      </AdminCardGrid>

      {/* Métriques */}
      <AdminCardGrid className="mt-6" columns={{
        default: 2,  // 2 colonnes même en mobile
        sm: 2,
        md: 2,
        lg: 4,
        xl: 4,
      }}>
        <DashboardMetricCard
          title="Courses non attribuées"
          value={isLoading ? "..." : metrics.pendingRides.toString()}
          icon={<MapPin className="h-4 w-4" />}
          href="/admin/rides/pending"
        />
        <DashboardMetricCard
          title="Chauffeurs actifs"
          value={isLoading ? "..." : metrics.activeDrivers.toString()}
          icon={<Users className="h-4 w-4" />}
          href="/admin/drivers"
        />
        <DashboardMetricCard
          title="Courses restantes"
          value={isLoading ? "..." : metrics.remainingRides.toString()}
          icon={<CalendarCheck className="h-4 w-4" />}
          href="/admin/rides/remaining"
        />
        <DashboardMetricCard
          title="Véhicules disponibles"
          value={isLoading ? "..." : metrics.availableVehicles.toString()}
          icon={<Car className="h-4 w-4" />}
          href="/admin/vehicles"
        />
      </AdminCardGrid>

      {/* Actions rapides */}
      <AdminCardGrid className="mt-6" columns={{
        default: 1,
        sm: 2,       // >640px - Petites tablettes
        md: 2,       // >768px - iPad Air
        lg: 2,       // >1024px - Écrans larges
      }}>
        <DashboardActionCard
          title="Tarifs kilométriques"
          description="Gérer les tarifs de base et kilométriques"
          href="/admin/rates"
          icon={<CreditCard className="h-4 w-4" />}
          iconColor="text-blue-500"
        />
        <DashboardActionCard
          title="Options et services"
          description="Configurer les options additionnelles"
          href="/admin/options"
          icon={<PackageOpen className="h-4 w-4" />}
          iconColor="text-green-500"
        />
      </AdminCardGrid>
    </>
  )
}
