"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/reservation/StatusBadge";
import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";

type RideRow = Database["public"]["Tables"]["rides"]["Row"];

function truncateAddress(address: string | null | undefined, max = 36): string {
  const value = (address ?? "").trim();
  if (!value) return "—";
  if (value.length <= max) return value;
  return `${value.slice(0, max)}…`;
}

type DashboardRecentRidesProps = Readonly<{
  refreshKey?: number;
}>;

export function DashboardRecentRides({
  refreshKey = 0,
}: DashboardRecentRidesProps) {
  const [recentRides, setRecentRides] = useState<RideRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecentRides = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("rides")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentRides(data ?? []);
    } catch (error) {
      console.error("Error loading recent rides:", error);
      setRecentRides([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRecentRides();
  }, [loadRecentRides, refreshKey]);

  return (
    <Card className="border-neutral-800 bg-neutral-900 w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-neutral-100 text-lg">
          Dernières courses
        </CardTitle>
        <CardDescription className="text-neutral-400">
          Les 5 dernières courses enregistrées
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {["sk-1", "sk-2", "sk-3"].map((key) => (
              <div
                key={key}
                className="h-14 animate-pulse rounded-lg bg-neutral-800"
              />
            ))}
          </div>
        ) : recentRides.length === 0 ? (
          <p className="text-center py-6 text-sm text-neutral-400">
            Aucune course récente
          </p>
        ) : (
          <div className="space-y-0">
            {recentRides.map((ride, index) => (
              <div key={ride.id}>
                <div className="flex items-center justify-between gap-3 py-3">
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">
                        {format(new Date(ride.pickup_time), "dd MMM yyyy", {
                          locale: fr,
                        })}
                      </span>
                      <StatusBadge status={ride.status} showDetailed />
                    </div>
                    <span className="text-xs text-neutral-400 truncate">
                      {truncateAddress(ride.pickup_address)} →{" "}
                      {truncateAddress(ride.dropoff_address)}
                    </span>
                  </div>
                  <Link
                    href="/backoffice-portal/rides"
                    className="text-xs text-blue-400 hover:text-blue-300 shrink-0"
                  >
                    Voir
                  </Link>
                </div>
                {index < recentRides.length - 1 && (
                  <Separator className="bg-neutral-800" />
                )}
              </div>
            ))}
            <div className="text-center pt-4">
              <Link
                href="/backoffice-portal/rides"
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Voir toutes les courses
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
