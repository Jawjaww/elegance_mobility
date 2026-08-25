import { formatCurrency } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { formatDateTime } from "@/lib/utils/date-format";
import { Car, MapPin, Bell } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { getRideStatusLabelForRide } from "@/lib/services/statusService";
import { RideIncentivePanel } from "./RideIncentivePanel";
import { formatLiveNavHint } from "@/lib/utils/liveNavHint";

import type { Database } from "@/lib/types/database.types";

interface ReservationCardProps {
  ride: Database["public"]["Tables"]["rides"]["Row"];
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDetails?: (id: string) => void;
  onRefresh?: () => void;
}

export default function ReservationCard({
  ride,
  onEdit,
  onCancel,
  onDetails,
  onRefresh,
}: Readonly<ReservationCardProps>) {
  // S'assurer que l'ID de la réservation est défini
  if (!ride.id) {
    console.error("Réservation sans ID détectée", ride);
    return null;
  }

  // Formater la date et l'heure
  const formattedDateTime = formatDateTime(ride.pickup_time);

  // Fonction pour capitaliser la première lettre
  const capitalize = (str: string) => {
    return str?.charAt(0).toUpperCase() + str?.slice(1).toLowerCase();
  };

  // Déterminer le type de trajet à afficher dans l'en-tête
  const getVehicleTypeDisplay = () => {
    if (!ride.vehicle_type) return "Trajet VTC";

    const vehicleType = ride.vehicle_type.toLowerCase();

    if (vehicleType.includes("van")) return "Van";
    if (vehicleType.includes("premium")) return "Premium";
    if (vehicleType.includes("standard")) return "Standard";

    // Capitaliser le type pour tout autre cas
    return `Trajet ${capitalize(vehicleType)}`;
  };

  const driverWaiting =
    ride.status === "scheduled" && Boolean(ride.driver_arrived_at);
  const statusLabel = getRideStatusLabelForRide(
    ride.status,
    ride.pickup_time,
    ride.driver_arrived_at,
  );
  const liveNavHint = formatLiveNavHint(ride);

  return (
    <Card className="overflow-hidden border-blue-500/15 bg-neutral-900/80 transition-colors duration-200 hover:border-blue-500/30">
      <CardHeader className="border-b border-blue-500/10 bg-neutral-950/40 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-neutral-100">
              {getVehicleTypeDisplay()}
            </h3>
          </div>
          <StatusBadge
            status={ride.status}
            driverArrivedAt={ride.driver_arrived_at}
            className="shadow-sm"
            showDetailed={true}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-4">
        {driverWaiting ? (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            <Bell className="h-4 w-4 shrink-0" />
            <span>{statusLabel} — votre chauffeur vous attend.</span>
          </div>
        ) : null}
        {liveNavHint ? (
          <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100">
            Estimation · {liveNavHint}
          </div>
        ) : null}
        <div className="text-sm">
          <p className="font-medium text-neutral-100">{formattedDateTime}</p>
        </div>

        <div className="space-y-3">
          <div className="flex">
            <div className="mr-2 flex flex-col items-center">
              <MapPin className="h-4 w-4 text-blue-400" />
              <div className="h-10 w-0.5 bg-neutral-700"></div>
              <MapPin className="h-4 w-4 text-sky-400" />
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-400">Départ</p>
                <p className="text-sm text-neutral-100">
                  {ride.pickup_address}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-neutral-400">
                  Destination
                </p>
                <p className="text-sm text-neutral-100">
                  {ride.dropoff_address}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Prix affiché directement sans le type de véhicule en doublon */}
        <div className="flex justify-end pt-2">
          <div className="text-lg font-semibold text-neutral-100">
            {ride.estimated_price != null
              ? formatCurrency(
                  Number(ride.estimated_price) +
                    Number(ride.client_incentive ?? 0),
                )
              : "Prix non défini"}
          </div>
        </div>

        {(ride.status === "pending" || ride.status === "delayed") && (
          <div className="pt-3">
            <RideIncentivePanel
              rideId={ride.id}
              status={ride.status}
              clientIncentive={Number(ride.client_incentive ?? 0)}
              matchingPausedAt={ride.matching_paused_at}
              matchingDeadlineAt={ride.matching_deadline_at}
              onUpdated={onRefresh}
            />
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-blue-500/10 bg-neutral-950/40 px-4 py-2">
        <div className="flex w-full justify-end gap-2">
          {onDetails && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-blue-500/25 bg-blue-500/5 text-neutral-200 hover:bg-blue-500/15 hover:text-white"
              onClick={() => onDetails(ride.id)}
            >
              Détails
            </Button>
          )}
          {onEdit &&
            (ride.status === "pending" || ride.status === "delayed") && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200"
              onClick={() => onEdit(ride.id)}
            >
              Modifier
            </Button>
          )}
          {onCancel &&
            (ride.status === "pending" || ride.status === "delayed") && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 text-xs border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
              onClick={() => onCancel(ride.id)}
            >
              Annuler
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
