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
  const { rides, loading } = useUnifiedRidesStore();
  const { drivers } = useDriversStore();
  const router = useRouter();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="elegant-backdrop animate-pulse">
            <div className="p-6 space-y-4">
              <div className="h-6 bg-neutral-800 rounded w-3/4" />
              <div className="space-y-2">
                <div className="h-4 bg-neutral-800 rounded w-full" />
                <div className="h-4 bg-neutral-800 rounded w-5/6" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (rides.length === 0) {
    return (
      <Card className="elegant-backdrop p-8 text-center">
        <p className="text-neutral-400">Aucune course trouvée</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {rides.map((ride: Ride) => {
        const StatusIcon = getStatusIcon(ride.status) || AlertCircle;

        return (
          <Card
            key={ride.id}
            className="elegant-backdrop group hover:border-neutral-700 transition-all duration-200"
          >
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">
                    Course #{ride.id.slice(0, 8)}
                  </h3>
                  <p className="text-sm text-neutral-400">
                    {format(new Date(ride.pickup_time), "d MMMM yyyy à HH:mm", {
                      locale: fr,
                    })}
                  </p>
                </div>
                <StatusBadge 
                  status={ride.status} 
                  showDetailedCancellation={true}
                  className="flex items-center gap-1.5"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-sm text-neutral-300 truncate">
                    {ride.pickup_address}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                  <span className="text-sm text-neutral-300 truncate">
                    {ride.dropoff_address}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="text-sm text-neutral-300 truncate">
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
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    className="flex-1 btn-secondary"
                    onClick={() =>
                      router.push(`/backoffice-portal/rides/${ride.id}/assign`)
                    }
                  >
                    <User className="w-4 h-4 mr-2" />
                    Assigner
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 btn-secondary"
                    onClick={() =>
                      router.push(`/backoffice-portal/rides/${ride.id}/vehicle`)
                    }
                  >
                    <Car className="w-4 h-4 mr-2" />
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
