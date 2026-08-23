"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/reservation/StatusBadge";
import { MapPin, User, XCircle } from "lucide-react";
import type { RideWithRelations } from "@/lib/stores/unifiedRidesStore";
import {
  cancelBadgeLabel,
  formatPersonName,
} from "@/lib/rides/rideCancelLabels";
import { CopyableRef } from "@/components/admin/CopyableRef";

const CANCELABLE = new Set([
  "pending",
  "scheduled",
  "in-progress",
  "delayed",
  "no-show",
]);

function RideStatusCorner({
  status,
  canceledBy,
}: Readonly<{
  status: string;
  canceledBy: string | null;
}>) {
  const isCanceled = status.includes("canceled");
  const reasonBadge = cancelBadgeLabel(status, canceledBy);

  if (!isCanceled) {
    return (
      <StatusBadge
        status={status}
        showDetailed
        className="text-xs sm:text-sm shadow-sm"
      />
    );
  }

  // Unified cancel chip: "Annulée" + secondary reason (Expirée / Admin / …)
  const secondary =
    reasonBadge && reasonBadge !== "Annulée" ? reasonBadge : null;

  return (
    <div className="inline-flex flex-col items-end gap-0.5">
      <span className="inline-flex items-center gap-1 rounded-md bg-red-500/15 px-2 py-1 text-xs font-medium text-red-400 border border-red-500/25">
        <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />
        Annulée
        {secondary ? (
          <span className="text-red-300/80 font-normal">· {secondary}</span>
        ) : null}
      </span>
    </div>
  );
}

export function AdminRideListCard({
  ride,
  driverLabel,
  onOpenDetails,
  onAssign,
  onCancel,
}: Readonly<{
  ride: RideWithRelations;
  driverLabel: string;
  onOpenDetails: () => void;
  onAssign: () => void;
  onCancel: () => void;
}>) {
  const pickup = new Date(ride.pickup_time);
  const customerName = formatPersonName(
    ride.customer?.first_name,
    ride.customer?.last_name,
  );
  const showDriver = Boolean(ride.driver_id);

  return (
    <Card className="overflow-hidden border-neutral-800 bg-neutral-900 w-full hover:border-neutral-700 transition-colors">
      <div className="p-4 sm:p-5">
        {/* Header: date/time left — status right */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <button
            type="button"
            onClick={onOpenDetails}
            className="text-left min-w-0 rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
          >
            <p className="text-sm sm:text-base font-semibold text-neutral-100 capitalize">
              {format(pickup, "EEEE d MMMM", { locale: fr })}
            </p>
            <p className="text-lg sm:text-xl font-bold text-neutral-50 tabular-nums tracking-tight mt-0.5">
              {format(pickup, "HH:mm", { locale: fr })}
            </p>
          </button>
          <RideStatusCorner
            status={ride.status}
            canceledBy={ride.canceled_by}
          />
        </div>

        {/* Center: pickup → dropoff */}
        <button
          type="button"
          onClick={onOpenDetails}
          className="w-full text-left rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
        >
          <div className="flex gap-3">
            <div className="flex flex-col items-center pt-0.5" aria-hidden>
              <MapPin className="h-4 w-4 text-emerald-500 shrink-0" />
              <div className="w-px flex-1 min-h-[28px] bg-neutral-700 my-1" />
              <MapPin className="h-4 w-4 text-rose-500 shrink-0" />
            </div>
            <div className="flex-1 min-w-0 space-y-4">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
                  Départ
                </p>
                <p className="text-sm text-neutral-100 leading-snug line-clamp-2">
                  {ride.pickup_address}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
                  Arrivée
                </p>
                <p className="text-sm text-neutral-100 leading-snug line-clamp-2">
                  {ride.dropoff_address}
                </p>
              </div>
            </div>
          </div>
        </button>

        {/* Footer meta: people left, ref right */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-end justify-between gap-3">
          <div className="min-w-0 space-y-1">
            {customerName !== "—" ? (
              <p className="text-xs text-neutral-500 truncate">
                <span className="text-neutral-600">Client</span>{" "}
                <span className="text-neutral-400">{customerName}</span>
              </p>
            ) : null}
            {showDriver ? (
              <p className="text-xs text-neutral-500 truncate flex items-center gap-1.5">
                <User className="h-3 w-3 text-sky-500 shrink-0" aria-hidden />
                <span className="text-neutral-400">{driverLabel}</span>
              </p>
            ) : (
              <p className="text-xs text-amber-500/80">Non assigné</p>
            )}
          </div>
          <CopyableRef value={ride.id} toastTitle="ID course copié" />
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {(ride.status === "pending" || ride.status === "scheduled") && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs bg-sky-950/40 border-sky-700/50 text-sky-300 hover:bg-sky-900/50"
              onClick={onAssign}
            >
              <User className="w-3.5 h-3.5 mr-1.5" />
              {ride.driver_id ? "Réassigner" : "Assigner"}
            </Button>
          )}
          {CANCELABLE.has(ride.status) && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-red-900/60 text-red-300 hover:bg-red-950/50"
              onClick={onCancel}
            >
              Annuler
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs text-neutral-400 hover:text-neutral-200 ml-auto"
            onClick={onOpenDetails}
          >
            Détails
          </Button>
        </div>
      </div>
    </Card>
  );
}
