import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type UiStatus } from "@/lib/services/statusService";
import type { Database } from "@/lib/types/database.types";

type DbRideStatus = Database["public"]["Enums"]["ride_status"];

interface StatusBadgeProps {
  status: UiStatus | DbRideStatus;
  className?: string;
  size?: "default" | "sm" | "lg";
  showDetailed?: boolean;
  driverArrivedAt?: string | null;
}

function normalizeStatus(status: UiStatus | DbRideStatus): UiStatus {
  switch (status) {
    case "client-canceled":
      return "clientCanceled";
    case "driver-canceled":
      return "driverCanceled";
    case "admin-canceled":
      return "adminCanceled";
    case "no-show":
      return "noShow";
    case "in-progress":
      return "inProgress";
    case "scheduled":
      return "accepted";
    default:
      return status;
  }
}

function badgeVariantForStatus(normalizedStatus: UiStatus): string {
  switch (normalizedStatus) {
    case "pending":
      return "pending";
    case "accepted":
      return "accepted";
    case "inProgress":
      return "inProgress";
    case "completed":
      return "completed";
    case "noShow":
      return "noShow";
    case "delayed":
      return "delayed";
    case "clientCanceled":
    case "driverCanceled":
    case "adminCanceled":
      return "canceled";
    default:
      return "default";
  }
}

function displayLabelForStatus(
  normalizedStatus: UiStatus,
  rawStatus: UiStatus | DbRideStatus,
  showDetailed: boolean,
  driverArrivedAt: string | null,
): string {
  if (
    ["clientCanceled", "driverCanceled", "adminCanceled"].includes(
      normalizedStatus,
    )
  ) {
    if (showDetailed) {
      return STATUS_LABELS[normalizedStatus] || "Annulée";
    }
    return "Annulée";
  }

  if (normalizedStatus === "accepted" && driverArrivedAt) {
    return "Chauffeur sur place";
  }

  return (
    STATUS_LABELS[normalizedStatus] ||
    String(rawStatus).charAt(0).toUpperCase() + String(rawStatus).slice(1)
  );
}

export function StatusBadge({
  status,
  className = "",
  size = "default",
  showDetailed = false,
  driverArrivedAt = null,
}: Readonly<StatusBadgeProps>) {
  const normalizedStatus = normalizeStatus(status);
  const variant = badgeVariantForStatus(normalizedStatus);
  const displayLabel = displayLabelForStatus(
    normalizedStatus,
    status,
    showDetailed,
    driverArrivedAt,
  );

  return (
    <Badge variant={variant as "default"} size={size} className={className}>
      {displayLabel}
    </Badge>
  );
}

export const SimpleStatusBadge = StatusBadge;
export const ReservationStatusBadge = StatusBadge;
