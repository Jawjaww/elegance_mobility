"use client";

import Link from "next/link";
import { Users, Wifi, WifiOff, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DashboardFleetPanelProps = Readonly<{
  onlineDrivers: number;
  activeDrivers: number;
  href?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}>;

export function DashboardFleetPanel({
  onlineDrivers,
  activeDrivers,
  href = "/backoffice-portal/drivers",
  onRefresh,
  refreshing = false,
}: DashboardFleetPanelProps) {
  const ratio =
    activeDrivers > 0
      ? Math.round((onlineDrivers / activeDrivers) * 100)
      : 0;
  const offline = Math.max(activeDrivers - onlineDrivers, 0);

  return (
    <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/[0.06] to-neutral-900 overflow-hidden">
      <div className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8">
        <div className="flex items-start gap-4 min-w-0 flex-1">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border bg-emerald-500/15 border-emerald-500/30 text-emerald-400">
            <Users className="h-6 w-6" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-400">
              Chauffeurs en ligne
            </p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-4xl font-bold tabular-nums text-emerald-100">
                {onlineDrivers}
              </p>
              <p className="text-sm text-neutral-500">
                sur {activeDrivers} actifs
              </p>
            </div>
            <div className="mt-3 h-2 w-full max-w-xs rounded-full bg-neutral-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500"
                style={{ width: `${ratio}%` }}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
            <Wifi className="h-4 w-4 text-emerald-400" aria-hidden />
            <span className="text-sm text-neutral-300">
              <span className="font-semibold text-white tabular-nums">
                {onlineDrivers}
              </span>{" "}
              en ligne
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-800/50 px-3 py-2">
            <WifiOff className="h-4 w-4 text-neutral-500" aria-hidden />
            <span className="text-sm text-neutral-400">
              <span className="font-semibold text-neutral-300 tabular-nums">
                {offline}
              </span>{" "}
              hors ligne
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 sm:ml-auto">
          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={refreshing}
              className="h-8 w-8 border-neutral-700 text-neutral-400 hover:bg-neutral-800"
              aria-label="Actualiser le dashboard"
            >
              <RefreshCw
                className={cn("h-4 w-4", refreshing && "animate-spin")}
                aria-hidden
              />
            </Button>
          ) : null}
          <Button
            asChild
            size="sm"
            variant="outline"
            className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
          >
            <Link href={href}>Voir la flotte</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
