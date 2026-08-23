"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, Navigation, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DashboardOpsPanel } from "@/components/admin/dashboard-ops-panel";
import { CopyableRef } from "@/components/admin/CopyableRef";
import { truncateAddress } from "@/lib/dashboard/adminDashboard";
import { supabase } from "@/lib/database/client";

type DriverEmbed = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  current_vehicle_id: string | null;
};

type RideLiveRow = {
  id: string;
  pickup_time: string;
  pickup_address: string;
  dropoff_address: string;
  driver_id: string | null;
  override_vehicle_id: string | null;
  driver: DriverEmbed | null;
  licensePlate: string | null;
};

type DashboardInProgressPanelProps = Readonly<{
  count: number;
  refreshKey?: number;
}>;

function normalizeDriver(
  driver: DriverEmbed | DriverEmbed[] | null | undefined,
): DriverEmbed | null {
  if (!driver) return null;
  return Array.isArray(driver) ? (driver[0] ?? null) : driver;
}

export function DashboardInProgressPanel({
  count,
  refreshKey = 0,
}: DashboardInProgressPanelProps) {
  const [rides, setRides] = useState<RideLiveRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rides")
        .select(
          `
          id,
          pickup_time,
          pickup_address,
          dropoff_address,
          driver_id,
          override_vehicle_id,
          driver:drivers(id, first_name, last_name, current_vehicle_id)
        `,
        )
        .eq("status", "in-progress")
        .order("pickup_time", { ascending: true })
        .limit(6);

      if (error) throw error;

      const rows = (data ?? []).map((row) => {
        const driver = normalizeDriver(
          row.driver as DriverEmbed | DriverEmbed[] | null,
        );
        return {
          id: row.id,
          pickup_time: row.pickup_time,
          pickup_address: row.pickup_address,
          dropoff_address: row.dropoff_address,
          driver_id: row.driver_id,
          override_vehicle_id: row.override_vehicle_id,
          driver,
          licensePlate: null as string | null,
        };
      });

      const vehicleIds = Array.from(
        new Set(
          rows
            .flatMap((r) => [
              r.override_vehicle_id,
              r.driver?.current_vehicle_id,
            ])
            .filter((id): id is string => Boolean(id)),
        ),
      );

      const plateById = new Map<string, string>();
      if (vehicleIds.length > 0) {
        const { data: vehicles } = await supabase
          .from("vehicles")
          .select("id, license_plate")
          .in("id", vehicleIds);

        for (const vehicle of vehicles ?? []) {
          if (vehicle.license_plate) {
            plateById.set(vehicle.id, vehicle.license_plate);
          }
        }
      }

      setRides(
        rows.map((ride) => {
          const vehicleId =
            ride.override_vehicle_id ?? ride.driver?.current_vehicle_id ?? null;
          return {
            ...ride,
            licensePlate: vehicleId ? (plateById.get(vehicleId) ?? null) : null,
          };
        }),
      );
    } catch (error) {
      console.error("Error loading in-progress rides:", error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <DashboardOpsPanel
      title="Courses en cours"
      count={count}
      subtitle="Suivi live · copier ID / plaque"
      icon={<Navigation className="h-5 w-5" aria-hidden />}
      tone="live"
      href="/backoffice-portal/rides?filter=in-progress"
      loading={loading}
      emptyMessage="Aucune course en cours pour le moment"
    >
      {rides.map((ride, index) => {
        const driverName = ride.driver
          ? [ride.driver.first_name, ride.driver.last_name]
              .filter(Boolean)
              .join(" ") || "—"
          : "—";

        return (
          <div key={ride.id}>
            <div className="flex items-start gap-3 py-2 rounded-lg hover:bg-neutral-800/40 px-2 -mx-2 transition-colors">
              <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <Navigation className="h-4 w-4 text-blue-400" aria-hidden />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white tabular-nums">
                    {format(new Date(ride.pickup_time), "HH:mm", { locale: fr })}
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm text-neutral-300">
                    <User className="h-3 w-3 text-neutral-500" aria-hidden />
                    {driverName}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                  {truncateAddress(ride.pickup_address, 38)} →{" "}
                  {truncateAddress(ride.dropoff_address, 38)}
                </p>
                <div className="flex items-center gap-2 flex-wrap mt-2">
                  <CopyableRef value={ride.id} toastTitle="ID course copié" />
                  {ride.driver_id ? (
                    <CopyableRef
                      value={ride.driver_id}
                      toastTitle="ID chauffeur copié"
                    />
                  ) : null}
                  {ride.licensePlate ? (
                    <CopyableRef
                      value={ride.licensePlate}
                      label={ride.licensePlate}
                      toastTitle="Plaque copiée"
                      className="inline-flex items-center gap-1 text-emerald-400/90 hover:text-emerald-300"
                    />
                  ) : null}
                </div>
              </div>
              <Button
                asChild
                size="sm"
                variant="ghost"
                className="shrink-0 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8 px-2"
              >
                <Link href="/backoffice-portal/rides?filter=in-progress">
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              </Button>
            </div>
            {index < rides.length - 1 ? (
              <Separator className="bg-neutral-800/60" />
            ) : null}
          </div>
        );
      })}
    </DashboardOpsPanel>
  );
}
