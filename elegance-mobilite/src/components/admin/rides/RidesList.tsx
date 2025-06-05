"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore";
import { useDriversStore } from "@/lib/stores/driversStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/reservation/StatusBadge";
import { MapPin, AlertCircle, User, Car } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Database } from "@/lib/types/database.types";
import {
  RIDE_STATUS_CONFIG,
  getStatusLabel,
  getStatusColor,
  getStatusIcon,
} from "@/lib/types/stores.types";

type Ride = Database["public"]["Tables"]["rides"]["Row"];

export function RidesList() {
  const { filteredRides, loading } = useUnifiedRidesStore();
  const { drivers } = useDriversStore();
  const router = useRouter();

  if (loading) {
    return (
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="elegant-backdrop animate-pulse border-neutral-800 bg-neutral-900/50">
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
        <p className="text-neutral-400 text-sm sm:text-base">Aucune course trouvée</p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {filteredRides.map((ride: Ride) => {
        const StatusIcon = getStatusIcon(ride.status) || AlertCircle;

        return (
          <Card
            key={ride.id}
            className="overflow-hidden border-neutral-800 bg-neutral-900 mx-auto"
            style={{ width: '80vw', maxWidth: '80vw', minWidth: 320 }}
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
                            (d) => d.id === ride.driver_id
                          );
                          return driver
                            ? `${driver.first_name} ${driver.last_name}`
                            : "Chauffeur introuvable";
                        })()
                      : "Non assigné"}
                  </span>
                </div>
              </div>

              {!ride.driver_id && ride.status === "pending" && (
                <div className="flex gap-2 mt-3 sm:mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 btn-secondary h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                    onClick={() =>
                      router.push(`/backoffice-portal/rides/${ride.id}/assign`)
                    }
                  >
                    <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Assigner
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 btn-secondary h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
                    onClick={() =>
                      router.push(`/backoffice-portal/rides/${ride.id}/vehicle`)
                    }
                  >
                    <Car className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Véhicule
                  </Button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
