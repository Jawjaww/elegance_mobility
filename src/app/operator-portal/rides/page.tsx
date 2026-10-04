"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";
import { supabase } from "@/lib/database/client";
import { driverDisplayName, formatAmount, formatRideDateTime } from "@/lib/operator/display";
import {
  canOperatorCancel,
  canOperatorReassign,
  rideStatusLabel,
  type RideStatus,
} from "@/lib/operator/rideActions";
import { PortalMessage, PortalSection, PortalSkeleton } from "../_components/PortalShell";

interface FleetRide {
  id: string;
  status: RideStatus;
  pickup_address: string | null;
  dropoff_address: string | null;
  pickup_time: string | null;
  vehicle_type: string | null;
  estimated_price: number | null;
  final_price: number | null;
  driver_id: string | null;
  canceled_by: string | null;
}

interface FleetDriverOption {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

interface RpcOutcome {
  success?: boolean;
  error?: string;
}

/** Ce qu'un opérateur peut faire d'une course, dit à l'écran sans mentir sur l'état. */
function ridePriceLabel(ride: FleetRide): string {
  return formatAmount(ride.final_price ?? ride.estimated_price);
}

export default function OperatorRidesPage() {
  const { toast } = useToast();
  const [rides, setRides] = useState<FleetRide[]>([]);
  const [drivers, setDrivers] = useState<FleetDriverOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyRideId, setBusyRideId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Les deux listes sont filtrées par la RLS : les courses de la flotte, ses chauffeurs.
      const [ridesResult, driversResult] = await Promise.all([
        supabase
          .from("rides")
          .select(
            "id, status, pickup_address, dropoff_address, pickup_time, vehicle_type, estimated_price, final_price, driver_id, canceled_by",
          )
          .order("pickup_time", { ascending: false })
          .limit(50),
        supabase
          .from("drivers")
          .select("id, first_name, last_name")
          .order("first_name", { ascending: true }),
      ]);

      if (ridesResult.error) throw new Error(ridesResult.error.message);
      if (driversResult.error) throw new Error(driversResult.error.message);

      setRides((ridesResult.data ?? []) as FleetRide[]);
      setDrivers((driversResult.data ?? []) as FleetDriverOption[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lecture des courses impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const reportRefusal = (title: string, outcome: RpcOutcome | null) => {
    toast({
      title,
      description: outcome?.error ?? "Raison inconnue.",
      variant: "destructive",
    });
  };

  const cancelRide = async (ride: FleetRide) => {
    if (busyRideId) return;

    const confirmed = globalThis.confirm(
      "Annuler cette course ? Le client sera prévenu par le serveur.",
    );
    if (!confirmed) return;

    setBusyRideId(ride.id);
    try {
      const { data, error: rpcError } = await supabase.rpc("operator_cancel_ride", {
        p_ride_id: ride.id,
        p_reason: "Annulée depuis le portail opérateur",
      });

      if (rpcError) {
        reportRefusal("Annulation refusée", { error: rpcError.message });
        return;
      }

      const outcome = data as RpcOutcome | null;
      if (!outcome?.success) {
        reportRefusal("Annulation refusée", outcome);
        return;
      }

      toast({ title: "Course annulée", variant: "success" });
      await load();
    } finally {
      setBusyRideId(null);
    }
  };

  const reassignRide = async (ride: FleetRide, driverId: string) => {
    if (busyRideId || !driverId) return;

    setBusyRideId(ride.id);
    try {
      const { data, error: rpcError } = await supabase.rpc("operator_reassign_ride", {
        p_ride_id: ride.id,
        p_driver_id: driverId,
      });

      if (rpcError) {
        reportRefusal("Réaffectation refusée", { error: rpcError.message });
        return;
      }

      const outcome = data as RpcOutcome | null;
      if (!outcome?.success) {
        reportRefusal("Réaffectation refusée", outcome);
        return;
      }

      toast({ title: "Course réaffectée", variant: "success" });
      await load();
    } finally {
      setBusyRideId(null);
    }
  };

  return (
    <PortalSection
      title="Courses"
      subtitle="Les courses de votre flotte. La sélection est faite par la base : vous ne voyez que les vôtres."
    >
      {loading ? (
        <PortalSkeleton rows={4} />
      ) : error ? (
        <PortalMessage title="Courses indisponibles." detail={error} onRetry={() => void load()} />
      ) : rides.length === 0 ? (
        <PortalMessage
          title="Aucune course pour votre flotte."
          detail="Une course vous est rattachée dès qu'un de vos chauffeurs l'accepte."
        />
      ) : (
        <Card className="overflow-x-auto border-neutral-800 bg-neutral-900/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Départ prévu</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Trajet</TableHead>
                <TableHead>Chauffeur</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.map((ride) => {
                const driverLabel = ride.driver_id
                  ? (drivers.find((driver) => driver.id === ride.driver_id) ?? null)
                  : null;
                const isBusy = busyRideId === ride.id;

                return (
                  <TableRow key={ride.id}>
                    <TableCell className="whitespace-nowrap text-neutral-300">
                      {formatRideDateTime(ride.pickup_time)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-neutral-700 text-neutral-300">
                        {rideStatusLabel(ride.status)}
                      </Badge>
                      {ride.status === "admin-canceled" && ride.canceled_by ? (
                        <span className="ml-2 text-xs text-neutral-500">
                          {ride.canceled_by === "operator" ? "par votre flotte" : "par la plateforme"}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-[18rem] text-neutral-400">
                      <span className="block truncate">{ride.pickup_address ?? "—"}</span>
                      <span className="block truncate text-xs text-neutral-500">
                        → {ride.dropoff_address ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-neutral-300">
                      {driverLabel ? driverDisplayName(driverLabel) : "Non affecté"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-neutral-300">
                      {ridePriceLabel(ride)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={!canOperatorCancel(ride.status) || isBusy}
                          onClick={() => void cancelRide(ride)}
                        >
                          Annuler
                        </Button>
                        <select
                          aria-label={`Réaffecter la course du ${formatRideDateTime(ride.pickup_time)}`}
                          className="h-9 rounded-md border border-neutral-700 bg-neutral-900 px-2 text-sm text-neutral-200 disabled:opacity-50"
                          defaultValue=""
                          disabled={!canOperatorReassign(ride.status) || isBusy}
                          onChange={(event) => {
                            const driverId = event.target.value;
                            event.target.value = "";
                            void reassignRide(ride, driverId);
                          }}
                        >
                          <option value="">Réaffecter…</option>
                          {drivers
                            .filter((driver) => driver.id !== ride.driver_id)
                            .map((driver) => (
                              <option key={driver.id} value={driver.id}>
                                {driverDisplayName(driver)}
                              </option>
                            ))}
                        </select>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </PortalSection>
  );
}
