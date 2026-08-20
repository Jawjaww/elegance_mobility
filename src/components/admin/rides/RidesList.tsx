"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore";
import { useDriversStore } from "@/lib/stores/driversStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/reservation/StatusBadge";
import { MapPin, User } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/types/database.types";
import { useToast } from "@/hooks/useToast";
import {
  adminCancelRide,
} from "@/services/adminRideService";

type Ride = Database["public"]["Tables"]["rides"]["Row"];

const CANCELABLE = new Set([
  "pending",
  "scheduled",
  "in-progress",
  "delayed",
  "no-show",
]);

const LOADING_SKELETON_IDS = [
  "ride-skel-1",
  "ride-skel-2",
  "ride-skel-3",
  "ride-skel-4",
  "ride-skel-5",
  "ride-skel-6",
] as const;

export function RidesList() {
  const { filteredRides, loading, fetchRides } = useUnifiedRidesStore();
  const { drivers } = useDriversStore();
  const router = useRouter();
  const { toast } = useToast();

  const handleCancel = async (rideId: string) => {
    const reason = window.prompt("Motif d'annulation admin (optionnel) :") ?? "";
    try {
      const result: any = await adminCancelRide(rideId, reason || undefined);
      if (result?.success === false) {
        toast({
          title: "Annulation impossible",
          description: result.error || "Erreur",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Course annulée" });
      await fetchRides?.();
    } catch (e: any) {
      toast({
        title: "Erreur",
        description: e?.message || String(e),
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LOADING_SKELETON_IDS.map((id) => (
          <Card
            key={id}
            className="elegant-backdrop animate-pulse border-neutral-800 bg-neutral-900/50"
          >
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="h-5 sm:h-6 bg-neutral-800 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-3 sm:h-4 bg-neutral-800 rounded w-full" />
                <div className="h-3 sm:h-4 bg-neutral-800 rounded w-5/6" />
                <div className="h-3 sm:h-4 bg-neutral-800 rounded w-4/5" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredRides.length === 0) {
    return (
      <Card className="elegant-backdrop p-6 sm:p-8 text-center border-neutral-800 bg-neutral-900/50">
        <p className="text-neutral-400 text-sm sm:text-base">
          Aucune course trouvée
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {filteredRides.map((ride: Ride) => (
          <Card
            key={ride.id}
            className="overflow-hidden border-neutral-800 bg-neutral-900 mx-auto"
            style={{ width: "80vw", maxWidth: "80vw", minWidth: 320 }}
          >
            <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-base sm:text-lg truncate">
                    Course #{ride.id.slice(0, 8)}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-400 truncate">
                    {format(new Date(ride.pickup_time), "d MMMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <div className="shrink-0">
                  <StatusBadge
                    status={ride.status}
                    showDetailed={true}
                    className="flex items-center gap-1.5 text-xs sm:text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-500 shrink-0" />
                  <span className="text-xs sm:text-sm text-neutral-300 truncate">
                    {ride.pickup_address}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" />
                  <span className="text-xs sm:text-sm text-neutral-300 truncate">
                    {ride.dropoff_address}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
                  <span className="text-xs sm:text-sm text-neutral-300 truncate">
                    {ride.driver_id
                      ? (() => {
                          const driver = drivers.find(
                            (d) => d.id === ride.driver_id,
                          );
                          return driver
                            ? `${driver.first_name} ${driver.last_name}`
                            : "Chauffeur introuvable";
                        })()
                      : "Non assigné"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-3 sm:mt-4">
                {(ride.status === "pending" || ride.status === "scheduled") && (
                  <Button
                    variant="outline"
                    className="flex-1 btn-secondary h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                    onClick={() =>
                      router.push(
                        `/backoffice-portal/rides/assign?id=${ride.id}`,
                      )
                    }
                  >
                    <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {ride.driver_id ? "Réassigner" : "Assigner"}
                  </Button>
                )}
                {CANCELABLE.has(ride.status) && (
                  <Button
                    variant="outline"
                    className="flex-1 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm border-red-800 text-red-300 hover:bg-red-950"
                    onClick={() => handleCancel(ride.id)}
                  >
                    Annuler
                  </Button>
                )}
              </div>
            </div>
          </Card>
      ))}
    </div>
  );
}
