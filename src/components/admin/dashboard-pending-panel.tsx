"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowRight, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { DashboardOpsPanel } from "@/components/admin/dashboard-ops-panel";
import { CopyableRef } from "@/components/admin/CopyableRef";
import { truncateAddress } from "@/lib/dashboard/adminDashboard";
import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";

type RideRow = Pick<
  Database["public"]["Tables"]["rides"]["Row"],
  "id" | "pickup_time" | "pickup_address" | "dropoff_address" | "driver_id"
>;

type DashboardPendingPanelProps = Readonly<{
  count: number;
  refreshKey?: number;
}>;

export function DashboardPendingPanel({
  count,
  refreshKey = 0,
}: DashboardPendingPanelProps) {
  const [rides, setRides] = useState<RideRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rides")
        .select("id, pickup_time, pickup_address, dropoff_address, driver_id")
        .eq("status", "pending")
        .order("pickup_time", { ascending: true })
        .limit(6);

      if (error) throw error;
      setRides(data ?? []);
    } catch (error) {
      console.error("Error loading pending queue:", error);
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
      title="Courses non attribuées"
      count={count}
      subtitle="Prochaines prises en charge"
      icon={<MapPin className="h-5 w-5" aria-hidden />}
      tone="pending"
      href="/backoffice-portal/rides/pending"
      linkLabel="Attribuer"
      loading={loading}
      emptyMessage="Aucune course en attente — tout est assigné"
    >
      {rides.map((ride, index) => (
        <div key={ride.id}>
          <div className="flex items-start gap-3 py-2 rounded-lg hover:bg-neutral-800/40 px-2 -mx-2 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Clock className="h-4 w-4 text-amber-400" aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-white tabular-nums">
                  {format(new Date(ride.pickup_time), "EEE d MMM · HH:mm", {
                    locale: fr,
                  })}
                </span>
                <CopyableRef value={ride.id} toastTitle="ID course copié" />
              </div>
              <p className="text-xs text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                <MapPin
                  className="inline h-3 w-3 mr-1 text-neutral-500 -mt-0.5"
                  aria-hidden
                />
                {truncateAddress(ride.pickup_address, 42)} →{" "}
                {truncateAddress(ride.dropoff_address, 42)}
              </p>
            </div>
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="shrink-0 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 h-8 px-2"
            >
              <Link href="/backoffice-portal/rides/pending">
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>
          {index < rides.length - 1 ? (
            <Separator className="bg-neutral-800/60" />
          ) : null}
        </div>
      ))}
    </DashboardOpsPanel>
  );
}
