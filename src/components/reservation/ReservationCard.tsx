import { formatCurrency } from "@/lib/utils";
import { Button } from "../ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "../ui/card";
import { formatDateTime } from "@/lib/utils/date-format";
import { Car, Bell } from "lucide-react";
import { TripEndpointRail } from "@/components/reservation/TripEndpointRail";
import { StatusBadge } from "./StatusBadge";
import { getRideStatusLabelForRide } from "@/lib/services/statusService";
import { RideIncentivePanel } from "./RideIncentivePanel";
import { formatLiveNavHint } from "@/lib/utils/liveNavHint";
import {
  cancelBadgeLabel,
  cancelChipWithBilling,
  clientStatusBadgeOverride,
  isSystemExpiredRide,
  vehicleTypeDisplayName,
} from "@/lib/rides/rideCancelLabels";
import {
  CancelPolicyLine,
  SystemExpiredNotice,
} from "./MatchingNotices";

import type { Database } from "@/lib/types/database.types";

type RideRow = Database["public"]["Tables"]["rides"]["Row"];

interface ReservationCardProps {
  ride: RideRow;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
  onDetails?: (id: string) => void;
  onRefresh?: () => void;
}

function isMatchingOpen(status: string): boolean {
  return status === "pending" || status === "delayed";
}

function rideFareLabel(
  estimated: number | null,
  incentive: number,
): string {
  if (estimated == null) return "Prix non défini";
  return formatCurrency(Number(estimated) + incentive);
}

function ReservationCardActions({
  rideId,
  matchingOpen,
  showCancel,
  onDetails,
  onEdit,
  onCancel,
}: Readonly<{
  rideId: string;
  matchingOpen: boolean;
  showCancel: boolean;
  onDetails?: (id: string) => void;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
}>) {
  return (
    <CardFooter className="border-t border-blue-500/10 bg-neutral-950/40 px-4 py-2">
      <div className="flex w-full justify-end gap-2">
        {onDetails ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs border-blue-500/25 bg-blue-500/5 text-neutral-200 hover:bg-blue-500/15 hover:text-white"
            onClick={() => onDetails(rideId)}
          >
            Détails
          </Button>
        ) : null}
        {onEdit && matchingOpen ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs border-blue-500/40 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20 hover:text-blue-200"
            onClick={() => onEdit(rideId)}
          >
            Modifier
          </Button>
        ) : null}
        {showCancel ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 text-xs border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-red-200"
            onClick={() => onCancel?.(rideId)}
          >
            Annuler
          </Button>
        ) : null}
      </div>
    </CardFooter>
  );
}

export default function ReservationCard({
  ride,
  onEdit,
  onCancel,
  onDetails,
  onRefresh,
}: Readonly<ReservationCardProps>) {
  if (!ride.id) {
    console.error("Réservation sans ID détectée", ride);
    return null;
  }

  const formattedDateTime = formatDateTime(ride.pickup_time);
  const matchingOpen = isMatchingOpen(ride.status);
  const driverWaiting =
    ride.status === "scheduled" && Boolean(ride.driver_arrived_at);
  const statusLabel = getRideStatusLabelForRide(
    ride.status,
    ride.pickup_time,
    ride.driver_arrived_at,
    ride.matching_deadline_at,
    ride.matching_paused_at,
  );
  const liveNavHint = formatLiveNavHint(ride);
  const systemExpired = isSystemExpiredRide(ride.status, ride.canceled_by);
  const cancelChip = cancelBadgeLabel(ride.status, ride.canceled_by);
  const badgeOverride = clientStatusBadgeOverride(
    ride.status,
    statusLabel,
    cancelChip,
    systemExpired,
  );
  const policyLine = cancelChipWithBilling(cancelChip, ride.cancel_billing);

  return (
    <Card className="overflow-hidden border-blue-500/15 bg-neutral-900/80 transition-colors duration-200 hover:border-blue-500/30">
      <CardHeader className="border-b border-blue-500/10 bg-neutral-950/40 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="h-5 w-5 text-blue-400" />
            <h3 className="font-semibold text-neutral-100">
              {vehicleTypeDisplayName(ride.vehicle_type)}
            </h3>
          </div>
          <StatusBadge
            status={ride.status}
            driverArrivedAt={ride.driver_arrived_at}
            className="shadow-sm"
            showDetailed={true}
            labelOverride={badgeOverride}
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
        {systemExpired ? <SystemExpiredNotice ride={ride} /> : null}
        <CancelPolicyLine text={policyLine} />
        <div className="text-sm">
          <p className="font-medium text-neutral-100">{formattedDateTime}</p>
        </div>

        <div className="flex gap-2">
          <TripEndpointRail className="pt-0.5" />
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-400">Départ</p>
              <p className="text-sm text-neutral-100">{ride.pickup_address}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-neutral-400">
                Destination
              </p>
              <p className="text-sm text-neutral-100">{ride.dropoff_address}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <div className="text-lg font-semibold text-neutral-100">
            {rideFareLabel(
              ride.estimated_price,
              Number(ride.client_incentive ?? 0),
            )}
          </div>
        </div>

        {matchingOpen ? (
          <div className="pt-3">
            <RideIncentivePanel
              rideId={ride.id}
              status={ride.status}
              clientIncentive={Number(ride.client_incentive ?? 0)}
              matchingPausedAt={ride.matching_paused_at}
              matchingDeadlineAt={ride.matching_deadline_at}
              onUpdated={onRefresh}
              onCancel={onCancel ? () => onCancel(ride.id) : undefined}
            />
          </div>
        ) : null}
      </CardContent>
      <ReservationCardActions
        rideId={ride.id}
        matchingOpen={matchingOpen}
        showCancel={Boolean(onCancel)}
        onDetails={onDetails}
        onEdit={onEdit}
        onCancel={onCancel}
      />
    </Card>
  );
}
