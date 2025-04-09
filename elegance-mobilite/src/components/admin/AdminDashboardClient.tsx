"use client";

import { useEffect, useState } from "react";
import { AdminCardGrid } from "./admin-card-grid";
import { Car, CalendarCheck, MapPin, Users, CreditCard, PackageOpen } from "lucide-react";
import { DashboardActionCard } from "./dashboard-action-card";
import { DashboardMetricCard } from "./dashboard-metric-card";
import type { DashboardMetrics } from "@/lib/services/dashboard";
import { AuthUser } from "@/lib/database/server";

interface AdminDashboardClientProps {
  initialMetrics: DashboardMetrics;
  user: AuthUser | null;
  isAdmin: boolean;
}

export function AdminDashboardClient({ 
  initialMetrics, 
  user, 
  isAdmin 
}: AdminDashboardClientProps) {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  
  // Pas besoin de recharger les métriques immédiatement puisqu'on les a déjà
  useEffect(() => {
    // On pourrait mettre en place une actualisation périodique ici si nécessaire
    const refreshInterval = setInterval(() => {
      // Actualisation toutes les 5 minutes par exemple
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, []);
  
  if (!user || !isAdmin) return null;
  
  return (
    <div className="space-y-6">
      {/* Carte principale des courses d'aujourd'hui */}
      <AdminCardGrid columns={{ default: 1 }}>
        <DashboardMetricCard
          title="Courses aujourd'hui"
          value={metrics.todayRides.toString()}
          icon={<MapPin className="h-4 w-4" />}
          trend={`${metrics.todayRidesTrend.percentage.toFixed(0)}%`}
          trendUp={metrics.todayRidesTrend.isUp}
          href="/admin/rides/today"
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
          href="/admin/rides/pending"
        />
        <DashboardMetricCard
          title="Chauffeurs actifs"
          value={metrics.activeDrivers.toString()}
          icon={<Users className="h-4 w-4" />}
          href="/admin/drivers"
        />
        <DashboardMetricCard
          title="Courses restantes"
          value={metrics.remainingRides.toString()}
          icon={<CalendarCheck className="h-4 w-4" />}
          href="/admin/rides/remaining"
        />
        <DashboardMetricCard
          title="Véhicules disponibles"
          value={metrics.availableVehicles.toString()}
          icon={<Car className="h-4 w-4" />}
          href="/admin/vehicles"
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
    </div>
  );
}
