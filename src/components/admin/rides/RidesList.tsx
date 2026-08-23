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

const LOADING_SKELETON_IDS = ["ride-skel-1", "ride-skel-2", "ride-skel-3"] as const;

const RIDES_GRID_CLASS =
  "grid w-full gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3";

function RideListCardSkeleton() {
  return (
    <Card className="overflow-hidden border-neutral-800 bg-neutral-900/50 animate-pulse w-full">
      <div className="p-4 sm:p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-neutral-800 rounded w-2/3" />
            <div className="h-7 bg-neutral-800 rounded w-1/3" />
          </div>
          <div className="h-6 w-16 bg-neutral-800 rounded-full shrink-0" />
        </div>
        <div className="flex gap-3">
          <div className="w-4 flex flex-col items-center gap-1 shrink-0">
            <div className="h-4 w-4 bg-neutral-800 rounded-full" />
            <div className="w-px flex-1 min-h-6 bg-neutral-800" />
            <div className="h-4 w-4 bg-neutral-800 rounded-full" />
          </div>
          <div className="flex-1 space-y-4">
            <div className="space-y-1.5">
              <div className="h-2.5 bg-neutral-800 rounded w-12" />
              <div className="h-4 bg-neutral-800 rounded w-full" />
            </div>
            <div className="space-y-1.5">
              <div className="h-2.5 bg-neutral-800 rounded w-12" />
              <div className="h-4 bg-neutral-800 rounded w-5/6" />
            </div>
          </div>
        </div>
        <div className="pt-3 border-t border-neutral-800/80 flex justify-between">
          <div className="h-3 bg-neutral-800 rounded w-1/3" />
          <div className="h-3 bg-neutral-800 rounded w-14" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 bg-neutral-800 rounded w-20" />
          <div className="h-8 bg-neutral-800 rounded w-16 ml-auto" />
        </div>
      </div>
    </Card>
  );
}

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
      <div className={RIDES_GRID_CLASS}>
        {LOADING_SKELETON_IDS.map((id) => (
          <RideListCardSkeleton key={id} />
        ))}
      </div>
    );
  }

  if (filteredRides.length === 0) {
    return (
      <Card className="elegant-backdrop p-6 sm:p-8 text-center border-neutral-800 bg-neutral-900/50 w-full">
        <p className="text-neutral-400 text-sm sm:text-base">
          Aucune course trouvée
        </p>
      </Card>
    );
  }

  return (
    <>
      <div className={RIDES_GRID_CLASS}>
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
