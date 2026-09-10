"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardOpsPanel } from "@/components/admin/dashboard-ops-panel";
import { CopyableRef } from "@/components/admin/CopyableRef";
import {
  overdueUnassignedOrFilter,
  truncateAddress,
} from "@/lib/dashboard/adminDashboard";
import { LANDING_CTA } from "@/components/landing/landingAssets";
import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";

type RideRow = Pick<
  Database["public"]["Tables"]["rides"]["Row"],
  "id" | "pickup_time" | "pickup_address" | "dropoff_address" | "status"
>;

type DashboardDelayedPanelProps = Readonly<{
  count: number;
  refreshKey?: number;
}>;

const DELAYED_PREVIEW = 3;
const DELAYED_HREF = "/backoffice-portal/rides?filter=delayed";

export function DashboardDelayedPanel({
  count,
  refreshKey = 0,
}: DashboardDelayedPanelProps) {
  const [rides, setRides] = useState<RideRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rides")
        .select("id, pickup_time, pickup_address, dropoff_address, status")
        .or(overdueUnassignedOrFilter(new Date().toISOString()))
        .order("pickup_time", { ascending: true })
        .limit(DELAYED_PREVIEW);

      if (error) throw error;
      setRides(data ?? []);
    } catch (error) {
      console.error("Error loading delayed queue:", error);
      setRides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const hero = rides[0];
  const rest = rides.slice(1);
  const moreCount = Math.max(count - DELAYED_PREVIEW, 0);

  return (
    <DashboardOpsPanel
      title="Courses en retard"
      count={count}
      subtitle="Urgences — pickup dépassé, sans chauffeur"
      icon={<AlertTriangle className="h-5 w-5" aria-hidden />}
      tone="urgent"
      href={DELAYED_HREF}
      linkLabel="Attribuer"
      loading={loading}
      emptyMessage="Aucune course en retard"
    >
      {hero ? (
        <div className="space-y-2">
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/[0.06] p-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-rose-300/90">
              Prioritaire
            </p>
            <p className="mt-1 text-sm font-semibold text-white tabular-nums">
              {format(new Date(hero.pickup_time), "EEE d MMM · HH:mm", {
                locale: fr,
              })}
            </p>
            <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">
              {truncateAddress(hero.pickup_address, 42)} →{" "}
              {truncateAddress(hero.dropoff_address, 42)}
            </p>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <CopyableRef value={hero.id} toastTitle="ID course copié" />
              <Button
                asChild
                size="sm"
                className={`h-8 shrink-0 px-3 ${LANDING_CTA}`}
              >
                <Link href={DELAYED_HREF}>Attribuer</Link>
              </Button>
            </div>
          </div>

          {rest.map((ride) => (
            <Link
              key={ride.id}
              href={DELAYED_HREF}
              className="flex items-center gap-2 rounded-lg px-1 py-1.5 min-w-0 hover:bg-neutral-800/40 transition-colors"
            >
              <Clock
                className="h-3.5 w-3.5 shrink-0 text-rose-400/80"
                aria-hidden
              />
              <span className="shrink-0 text-xs font-medium tabular-nums text-white">
                {format(new Date(ride.pickup_time), "HH:mm", { locale: fr })}
              </span>
              <span className="min-w-0 truncate text-xs text-neutral-400">
                {truncateAddress(ride.pickup_address, 28)} →{" "}
                {truncateAddress(ride.dropoff_address, 28)}
              </span>
            </Link>
          ))}

          {moreCount > 0 ? (
            <Link
              href={DELAYED_HREF}
              className="block pt-0.5 text-xs font-medium text-rose-300 hover:text-rose-200"
            >
              Voir les {moreCount} autres
            </Link>
          ) : null}
        </div>
      ) : null}
    </DashboardOpsPanel>
  );
}
