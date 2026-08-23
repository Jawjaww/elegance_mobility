"use client";

import { useState } from "react";
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore";
import type { RideWithRelations } from "@/lib/stores/unifiedRidesStore";
import { useDriversStore } from "@/lib/stores/driversStore";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import { adminCancelRide, isAdminRpcFailure } from "@/services/adminRideService";
import { AdminRideListCard } from "./AdminRideListCard";
import { RideDetailDialog } from "./RideDetailDialog";
import { formatPersonName } from "@/lib/rides/rideCancelLabels";

const LOADING_SKELETON_IDS = [
  "ride-skel-1",
  "ride-skel-2",
  "ride-skel-3",
  "ride-skel-4",
  "ride-skel-5",
  "ride-skel-6",
] as const;

function resolveDriverLabel(
  ride: RideWithRelations,
  drivers: Array<{ id: string; first_name: string | null; last_name: string | null }>,
): string {
  if (ride.driver) {
    return formatPersonName(ride.driver.first_name, ride.driver.last_name);
  }
  if (!ride.driver_id) return "Non assigné";
  const fromStore = drivers.find((d) => d.id === ride.driver_id);
  if (fromStore) {
    return formatPersonName(fromStore.first_name, fromStore.last_name);
  }
  return "Chauffeur introuvable";
}

export function RidesList() {
  const { filteredRides, loading, fetchRides } = useUnifiedRidesStore();
  const { drivers } = useDriversStore();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedRide, setSelectedRide] = useState<RideWithRelations | null>(
    null,
  );
  const [detailOpen, setDetailOpen] = useState(false);

  const openDetails = (ride: RideWithRelations) => {
    setSelectedRide(ride);
    setDetailOpen(true);
  };

  const handleCancel = async (rideId: string) => {
    const reason = window.prompt("Motif d'annulation admin (optionnel) :") ?? "";
    try {
      const result = await adminCancelRide(rideId, reason || undefined);
      if (isAdminRpcFailure(result)) {
        toast({
          title: "Annulation impossible",
          description:
            typeof result.error === "string" ? result.error : "Erreur",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Course annulée" });
      await fetchRides?.();
    } catch (e: unknown) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : String(e),
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
    <>
      <div className="flex flex-col items-center gap-4 w-full">
        {filteredRides.map((ride) => (
          <AdminRideListCard
            key={ride.id}
            ride={ride}
            driverLabel={resolveDriverLabel(ride, drivers)}
            onOpenDetails={() => openDetails(ride)}
            onAssign={() =>
              router.push(`/backoffice-portal/rides/assign?id=${ride.id}`)
            }
            onCancel={() => {
              void handleCancel(ride.id);
            }}
          />
        ))}
      </div>

      <RideDetailDialog
        ride={selectedRide}
        open={detailOpen}
        onOpenChange={(open) => {
          setDetailOpen(open);
          if (!open) setSelectedRide(null);
        }}
      />
    </>
  );
}
