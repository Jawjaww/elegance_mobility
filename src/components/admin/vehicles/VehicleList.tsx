"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Edit, Trash2, User } from "lucide-react";
import { formatPersonName } from "@/lib/rides/rideCancelLabels";
import type { VehicleWithDriver } from "@/lib/vehicle";
import type { Database } from "@/lib/types/database.types";

type VehicleType = Database["public"]["Enums"]["vehicle_type_enum"];

const vehicleTypeLabels: Record<VehicleType, string> = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
  VAN: "Van",
  ELECTRIC: "Électrique",
};

const vehicleTypeColors: Record<VehicleType, string> = {
  STANDARD: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PREMIUM: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  VAN: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ELECTRIC: "bg-green-500/20 text-green-400 border-green-500/30",
};

function driverLabel(vehicle: VehicleWithDriver): string {
  if (!vehicle.driver) return "Non assigné";
  const name = formatPersonName(
    vehicle.driver.first_name,
    vehicle.driver.last_name,
  );
  const phone = vehicle.driver.phone?.trim();
  if (phone && name !== "—") return `${name} · ${phone}`;
  return name;
}

interface VehicleListProps {
  vehicles: VehicleWithDriver[];
  loading: boolean;
  onEdit: (vehicle: VehicleWithDriver) => void;
  onDelete: (vehicle: VehicleWithDriver) => void;
}

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"] as const;

export function VehicleList({
  vehicles,
  loading,
  onEdit,
  onDelete,
}: Readonly<VehicleListProps>) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        {SKELETON_KEYS.map((key) => (
          <Card
            key={key}
            className="animate-pulse border-neutral-800 bg-neutral-900/50 mx-auto"
            style={{ width: "80vw", maxWidth: "80vw", minWidth: 320 }}
          >
            <div className="p-4 sm:p-6 space-y-3">
              <div className="h-6 bg-neutral-800 rounded w-3/4" />
              <div className="h-4 bg-neutral-800 rounded w-1/2" />
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (vehicles.length === 0) {
    return (
      <Card
        className="border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 text-center mx-auto"
        style={{ width: "80vw", maxWidth: "80vw", minWidth: 320 }}
      >
        <Car className="w-12 h-12 mx-auto text-neutral-600 mb-4" />
        <p className="text-neutral-400 text-sm sm:text-base">
          Aucun véhicule trouvé
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {vehicles.map((vehicle) => {
        const isCurrentVehicle =
          vehicle.driver?.current_vehicle_id === vehicle.id;

        return (
          <Card
            key={vehicle.id}
            className="overflow-hidden border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition-all mx-auto"
            style={{ width: "80vw", maxWidth: "80vw", minWidth: 320 }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-4 min-w-0 flex-1">
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background: "rgba(59, 130, 246, 0.1)",
                      border: "1px solid rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    <Car className="w-6 h-6 text-blue-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-base sm:text-lg text-white truncate">
                      {`${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim() ||
                        "—"}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-400 font-mono">
                      {vehicle.license_plate}
                    </p>
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs sm:text-sm text-neutral-300">
                      <User className="h-3.5 w-3.5 shrink-0 text-neutral-500" />
                      <span className="truncate">{driverLabel(vehicle)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  {vehicle.vehicle_type ? (
                    <Badge
                      className={`${vehicleTypeColors[vehicle.vehicle_type]} text-xs sm:text-sm px-2 py-1`}
                      variant="outline"
                    >
                      {vehicleTypeLabels[vehicle.vehicle_type]}
                    </Badge>
                  ) : (
                    <Badge
                      className="text-xs sm:text-sm px-2 py-1"
                      variant="outline"
                    >
                      —
                    </Badge>
                  )}
                  {vehicle.is_primary && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/30"
                    >
                      Principal
                    </Badge>
                  )}
                  {isCurrentVehicle && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    >
                      Actuel
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-neutral-700 hover:bg-neutral-800"
                  onClick={() => onEdit(vehicle)}
                >
                  <Edit className="w-3.5 h-3.5 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-red-900/50 text-red-400 hover:bg-red-950/50 hover:border-red-800"
                  onClick={() => onDelete(vehicle)}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
