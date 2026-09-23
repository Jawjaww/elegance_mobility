"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardMetricCard } from "./dashboard-metric-card";
import { DashboardActionCard } from "./dashboard-action-card";
import { DashboardPendingPanel } from "./dashboard-pending-panel";
import { DashboardDelayedPanel } from "./dashboard-delayed-panel";
import { DashboardInProgressPanel } from "./dashboard-in-progress-panel";
import { DashboardFleetPanel } from "./dashboard-fleet-panel";
import { AdminCardGrid } from "./admin-card-grid";
import {
  Car,
  Clock,
  CreditCard,
  MapPin,
  PackageOpen,
  Scale,
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
      <Card className="animate-pulse border-neutral-800 bg-neutral-900/50 h-[108px]" />
      <div className="grid grid-cols-2 gap-4">
        <Card className="animate-pulse border-neutral-800 bg-neutral-900/50 h-20" />
        <Card className="animate-pulse border-neutral-800 bg-neutral-900/50 h-20" />
      </div>
    </div>
  );
}

function DashboardUnavailable({
  message,
  onRetry,
}: Readonly<{ message: string | null; onRetry: () => void }>) {
  return (
    <Card className="elegant-backdrop p-6 sm:p-8 text-center border-neutral-800 bg-neutral-900/50 w-full">
      <p className="text-neutral-400 text-sm sm:text-base">
        Tableau de bord indisponible.
      </p>
      <p className="mt-2 break-words text-xs text-neutral-500 sm:text-sm">
        {message ?? "Cause inconnue : le client n'a renvoyé aucun message."}
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onRetry}
        className="mt-4 min-h-11 w-full px-8 sm:w-auto"
      >
        Réessayer
      </Button>
    </Card>
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
  // A failed first load leaves `metrics` null, so the dashboard would sit on its skeleton with
  // no way out. Naming the cause and offering a retry turns that into a recoverable state.
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(
    async (opts?: { silent?: boolean; bumpLists?: boolean }) => {
      const silent = opts?.silent ?? false;
      try {
        const updatedMetrics = await MetricsService.getDashboardMetrics();
        setMetrics(updatedMetrics);
        setLoadError(null);
        if (opts?.bumpLists) {
          setRefreshKey((k) => k + 1);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des métriques:", error);
        const message =
          error instanceof Error
            ? error.message
            : "Impossible de charger le dashboard";
        // Only the first-load path owns the error card: a failed background poll must leave the
        // last good numbers on screen rather than replacing them with an error.
        if (!silent && !initialMetrics) {
          setLoadError(message);
        }
        if (!silent) {
          toast({
            variant: "destructive",
            title: "Erreur",
            description: message,
          });
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [toast, initialMetrics],
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

  const retry = () => {
    setLoading(true);
    void load();
  };

  // Early returns rather than a chain of ternaries: loading, unavailable and loaded are three
  // states of the page, not three values of one expression.
  if (loading) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <DashboardSkeleton />
      </div>
    );
  }

  // A failed first load used to leave the skeleton spinning forever, with the toast gone and
  // nothing to click.
  if (!metrics) {
    return (
      <div className="space-y-5 lg:space-y-6">
        <DashboardUnavailable message={loadError} onRetry={retry} />
      </div>
    );
  }

  return (
    <div className="space-y-5 lg:space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:items-stretch">
        <DashboardPendingPanel
          count={metrics.pendingRides}
          refreshKey={refreshKey}
        />
        <DashboardDelayedPanel
          count={metrics.delayedRides}
          refreshKey={refreshKey}
        />
      </div>

      <DashboardInProgressPanel
        count={metrics.inProgressRides}
        refreshKey={refreshKey}
      />

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
            title="Politique courses"
            description="Durées de recherche et frais d’annulation"
            href="/backoffice-portal/ride-policies"
            icon={<Scale className="h-5 w-5" aria-hidden />}
            iconClassName="bg-violet-500/10 border-violet-500/20 text-violet-400"
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
    </div>
  );
}
