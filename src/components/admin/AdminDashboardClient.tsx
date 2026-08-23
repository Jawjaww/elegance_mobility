"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { DashboardActionCard } from "./dashboard-action-card";
import { DashboardPendingPanel } from "./dashboard-pending-panel";
import { DashboardInProgressPanel } from "./dashboard-in-progress-panel";
import { DashboardFleetPanel } from "./dashboard-fleet-panel";
import { AdminCardGrid } from "./admin-card-grid";
import {
  Car,
  Clock,
  CreditCard,
  MapPin,
  PackageOpen,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import {
  MetricsService,
  type DashboardMetrics,
} from "@/lib/services/metricsService";

interface AdminDashboardClientProps {
  initialMetrics?: DashboardMetrics;
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
        <Card className="animate-pulse border-neutral-800 bg-neutral-900/50 h-[108px]" />
        <Card className="animate-pulse border-neutral-800 bg-neutral-900/50 h-[108px]" />
      </div>
      <Card className="animate-pulse border-neutral-800 bg-neutral-900/50 h-24" />
      <div className="grid grid-cols-2 gap-4">
        <Card className="animate-pulse border-neutral-800 bg-neutral-900/50 h-20" />
        <Card className="animate-pulse border-neutral-800 bg-neutral-900/50 h-20" />
      </div>
    </div>
  );
}

export function AdminDashboardClient({
  initialMetrics,
}: Readonly<AdminDashboardClientProps>) {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(
    initialMetrics ?? null,
  );
  const [loading, setLoading] = useState(!initialMetrics);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(
    async (opts?: { silent?: boolean; bumpLists?: boolean }) => {
      const silent = opts?.silent ?? false;
      try {
        const updatedMetrics = await MetricsService.getDashboardMetrics();
        setMetrics(updatedMetrics);
        if (opts?.bumpLists) {
          setRefreshKey((k) => k + 1);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des métriques:", error);
        if (!silent) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description:
              error instanceof Error
                ? error.message
                : "Impossible de charger le dashboard",
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast],
  );

  useEffect(() => {
    if (!initialMetrics) {
      void load();
    }

    const interval = setInterval(() => {
      void load({ silent: true });
    }, 60_000);

    return () => clearInterval(interval);
  }, [initialMetrics, load]);

  const handleRefresh = () => {
    setRefreshing(true);
    void load({ bumpLists: true });
  };

  return (
    <div className="space-y-5 lg:space-y-6">
      {loading || !metrics ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
            <DashboardPendingPanel
              count={metrics.pendingRides}
              refreshKey={refreshKey}
            />
            <DashboardInProgressPanel
              count={metrics.inProgressRides}
              refreshKey={refreshKey}
            />
          </div>

          <DashboardFleetPanel
            onlineDrivers={metrics.onlineDrivers}
            activeDrivers={metrics.activeDrivers}
            onRefresh={handleRefresh}
            refreshing={refreshing}
          />

          <div>

            <AdminCardGrid
              columns={{
                default: 1,
                sm: 2,
                md: 2,
                lg: 2,
              }}
            >
              <DashboardMetricCard
                title="Courses aujourd'hui"
                value={metrics.todayRides.toString()}
                icon={<MapPin className="h-5 w-5" aria-hidden />}
                trend={`${metrics.todayRidesTrend.percentage.toFixed(0)}%`}
                trendUp={metrics.todayRidesTrend.isUp}
                href="/backoffice-portal/rides/today"
                tone="highlighted"
              />
              <DashboardMetricCard
                title="Véhicules enregistrés"
                value={metrics.availableVehicles.toString()}
                icon={<Car className="h-5 w-5" aria-hidden />}
                href="/backoffice-portal/vehicles"
              />
            </AdminCardGrid>
          </div>

          <div>
            <h3 className="text-xs font-medium uppercase tracking-wider text-neutral-500 mb-3">
              Accès rapides
            </h3>
            <AdminCardGrid
              columns={{
                default: 1,
                sm: 2,
                lg: 3,
              }}
            >
              <DashboardActionCard
                title="Chauffeurs en attente"
                description="Valider les dossiers"
                href="/backoffice-portal/drivers/pending"
                icon={<Clock className="h-5 w-5" aria-hidden />}
                iconClassName="bg-orange-500/10 border-orange-500/20 text-orange-400"
              />
              <DashboardActionCard
                title="Tarifs"
                description="Base et kilométrique"
                href="/backoffice-portal/rates"
                icon={<CreditCard className="h-5 w-5" aria-hidden />}
                iconClassName="bg-blue-500/10 border-blue-500/20 text-blue-400"
              />
              <DashboardActionCard
                title="Options"
                description="Services additionnels"
                href="/backoffice-portal/options"
                icon={<PackageOpen className="h-5 w-5" aria-hidden />}
                iconClassName="bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              />
            </AdminCardGrid>
          </div>
        </>
      )}
    </div>
  );
}
