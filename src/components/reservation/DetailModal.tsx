"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/utils/date-format";
import { formatCurrency } from "@/lib/utils";
import { Car, MapPin, Calendar, Clock3, Route } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { RideIncentivePanel } from "./RideIncentivePanel";
import { formatLiveNavHint } from "@/lib/utils/liveNavHint";
import type { Database } from "@/lib/types/database.types";

type DbRideStatus = Database["public"]["Enums"]["ride_status"];

interface Reservation {
  id: string;
  pickup_time: string;
  pickup_address: string;
  dropoff_address: string;
  vehicle_type?: string;
  status: DbRideStatus;
  estimated_price?: number | null;
  client_incentive?: number | null;
  matching_deadline_at?: string | null;
  matching_paused_at?: string | null;
  live_eta_minutes?: number | null;
  live_remaining_m?: number | null;
  nav_updated_at?: string | null;
  distance?: number | null;
  duration?: number | null;
  created_at: string;
}

type DetailModalProps = Readonly<{
  ride: Reservation | null;
  open: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}>;

export default function DetailModal({
  ride,
  open,
  onClose,
  onRefresh,
}: DetailModalProps) {
  if (!ride) return null;

  const formattedDateTime = formatDateTime(ride.pickup_time);
  const incentive = Number(ride.client_incentive ?? 0);
  const total =
    ride.estimated_price != null
      ? Number(ride.estimated_price) + incentive
      : null;
  const liveNavHint = formatLiveNavHint(ride);

  const capitalize = (str: string | undefined) => {
    if (!str) return "";
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-neutral-900 border-neutral-800 text-neutral-100 sm:max-w-md">
        <DialogHeader className="relative">
          <div className="mb-1.5">
            <StatusBadge status={ride.status} />
          </div>
          <DialogTitle>Détails de la réservation</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Informations sur votre trajet du {formattedDateTime}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {liveNavHint ? (
            <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100">
              Estimation · {liveNavHint}
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-neutral-400">Date et heure</p>
              <p className="text-neutral-100">{formattedDateTime}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-500 mt-1" />
            <div>
              <p className="text-sm text-neutral-400">Adresse de départ</p>
              <p className="text-neutral-100">{ride.pickup_address}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-500 mt-1" />
            <div>
              <p className="text-sm text-neutral-400">Adresse d&apos;arrivée</p>
              <p className="text-neutral-100">{ride.dropoff_address}</p>
            </div>
          </div>

          {ride.vehicle_type && (
            <div className="flex items-center gap-3">
              <Car className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-neutral-400">Type de véhicule</p>
                <p className="text-neutral-100">{capitalize(ride.vehicle_type)}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-2">
            {ride.distance ? (
              <div className="flex items-center gap-3">
                <Route className="h-4 w-4 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Distance</p>
                  <p className="text-sm text-neutral-200">{ride.distance} km</p>
                </div>
              </div>
            ) : null}

            {ride.duration ? (
              <div className="flex items-center gap-3">
                <Clock3 className="h-4 w-4 text-neutral-400" />
                <div>
                  <p className="text-xs text-neutral-500">Durée</p>
                  <p className="text-sm text-neutral-200">{ride.duration} min</p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="border-t border-neutral-800 pt-4 mt-4 space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-neutral-400">Tarif estimé</p>
              <p className="text-lg font-semibold text-blue-400">
                {total != null ? formatCurrency(total) : "Prix non défini"}
              </p>
            </div>
            {incentive > 0 ? (
              <p className="text-xs text-amber-200/80 text-right">
                dont bonus {formatCurrency(incentive)}
              </p>
            ) : null}
            <RideIncentivePanel
              rideId={ride.id}
              status={ride.status}
              clientIncentive={incentive}
              matchingPausedAt={ride.matching_paused_at}
              matchingDeadlineAt={ride.matching_deadline_at}
              onUpdated={onRefresh}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
