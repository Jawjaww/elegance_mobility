"use client"

import { AdminCardGrid } from "@/components/admin/admin-card-grid"
import { Car, CalendarCheck, MapPin, Users, CreditCard, PackageOpen } from "lucide-react"
import { DashboardActionCard } from "@/components/admin/dashboard-action-card"
import { DashboardMetricCard } from "@/components/admin/dashboard-metric-card"

export default function AdminDashboard() {
  return (
    <>
      {/* Carte principale des courses d'aujourd'hui */}
      <AdminCardGrid columns={{ default: 1 }}>
        <DashboardMetricCard
          title="Courses aujourd'hui"
          value="12"
          icon={<MapPin className="h-4 w-4" />}
          trend="+20%"
          trendUp={true}
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
          value="5"
          icon={<MapPin className="h-4 w-4" />}
          trend="+2"
          trendUp={false}
          href="/admin/rides/pending"
        />
        <DashboardMetricCard
          title="Chauffeurs actifs"
          value="8"
          icon={<Users className="h-4 w-4" />}
          href="/admin/drivers"
        />
        <DashboardMetricCard
          title="Courses restantes"
          value="7"
          icon={<CalendarCheck className="h-4 w-4" />}
          trend="+2"
          trendUp={false}
          href="/admin/rides/remaining"
        />
        <DashboardMetricCard
          title="Véhicules disponibles"
          value="15"
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
