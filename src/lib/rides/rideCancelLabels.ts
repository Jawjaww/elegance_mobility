/** Helpers for ride cancellation display (backoffice + client). */

export type CanceledBy = "system" | "admin" | "client" | "driver";

export type CancelBilling = "none" | "client_fee" | "waive";

const CANCELED_BY_LABELS: Record<CanceledBy, string> = {
  system: "Système — aucun chauffeur",
  admin: "Administrateur",
  client: "Client",
  driver: "Chauffeur",
};

export function canceledByLabel(canceledBy: string | null | undefined): string {
  if (!canceledBy) return "Inconnu";
  return CANCELED_BY_LABELS[canceledBy as CanceledBy] ?? canceledBy;
}

/** Short badge for list cards. */
export function cancelBadgeLabel(
  status: string,
  canceledBy: string | null | undefined,
): string | null {
  if (!status.includes("canceled")) return null;
  if (canceledBy === "system") return "Expirée — aucun chauffeur";
  if (canceledBy === "admin") return "Annulée admin";
  if (canceledBy === "client") return "Annulée client";
  if (canceledBy === "driver") return "Annulée chauffeur";
  if (status === "admin-canceled") return "Annulée admin";
  if (status === "client-canceled") return "Annulée client";
  if (status === "driver-canceled") return "Annulée chauffeur";
  return "Annulée";
}

export function cancelBillingLabel(
  billing: string | null | undefined,
): string {
  if (billing === "client_fee") return "Frais applicables";
  if (billing === "waive") return "Frais annulés";
  return "Aucun frais";
}

const CANCEL_REASON_CODE_LABELS: Record<string, string> = {
  client_cancel_free: "Aucun frais",
  client_cancel_en_route: "Chauffeur déjà en route",
  client_cancel_after_arrival: "Après arrivée du chauffeur",
  client_cancel_driver_late: "Chauffeur en retard — aucun frais",
  client_no_show: "Client absent",
  in_progress_blocked: "Course en cours — annulation impossible",
};

export function cancelReasonCodeLabel(
  code: string | null | undefined,
): string {
  if (!code) return "—";
  return CANCEL_REASON_CODE_LABELS[code] ?? code;
}

export function canClientCancelRide(status: string): boolean {
  return status === "pending" || status === "delayed" || status === "scheduled";
}

export function isSystemExpiredRide(
  status: string,
  canceledBy: string | null | undefined,
): boolean {
  return status === "admin-canceled" && canceledBy === "system";
}

/** Client portal badge when matching / expire labels differ from STATUS_LABELS. */
export function clientStatusBadgeOverride(
  status: string,
  matchingLabel: string,
  cancelChip: string | null,
  systemExpired: boolean,
): string | null {
  if (status === "pending" || status === "delayed") return matchingLabel;
  if (systemExpired) return cancelChip;
  return null;
}

/** Admin badge: pause first, then matching delay. */
export function adminMatchingBadgeOverride(
  matchingPausedAt: string | null | undefined,
  status: string,
  delayKind: string | null | undefined,
): string | null {
  if (matchingPausedAt) return "Recherche en pause";
  if (status === "delayed" || delayKind === "matching") {
    return "Retard matching";
  }
  return null;
}

const DELAY_KIND_LABELS: Record<string, string> = {
  matching: "Matching (pas de chauffeur)",
  driver_late: "Chauffeur en retard",
  client_late: "Client en retard",
};

export function delayKindLabel(kind: string | null | undefined): string {
  if (!kind) return "—";
  return DELAY_KIND_LABELS[kind] ?? kind;
}

export function cancelChipWithBilling(
  cancelChip: string | null,
  billing: string | null | undefined,
): string | null {
  if (!cancelChip) return null;
  if (!billing) return cancelChip;
  return `${cancelChip} · ${cancelBillingLabel(billing)}`;
}

export function vehicleTypeDisplayName(
  vehicleType: string | null | undefined,
): string {
  if (!vehicleType) return "Trajet VTC";
  const lower = vehicleType.toLowerCase();
  if (lower.includes("van")) return "Van";
  if (lower.includes("premium")) return "Premium";
  if (lower.includes("standard")) return "Standard";
  return `Trajet ${vehicleType.charAt(0).toUpperCase()}${vehicleType.slice(1).toLowerCase()}`;
}

/** Build reservation URL prefilled from an expired ride. */
export function buildRebookHref(ride: {
  pickup_address: string;
  dropoff_address: string;
  pickup_lat?: number | null;
  pickup_lon?: number | null;
  dropoff_lat?: number | null;
  dropoff_lon?: number | null;
  vehicle_type?: string | null;
  options?: string[] | null;
}): string {
  const params = new URLSearchParams();
  params.set("rebook", "1");
  params.set("from", ride.pickup_address);
  params.set("to", ride.dropoff_address);
  if (ride.pickup_lat != null) params.set("from_lat", String(ride.pickup_lat));
  if (ride.pickup_lon != null) params.set("from_lon", String(ride.pickup_lon));
  if (ride.dropoff_lat != null) params.set("to_lat", String(ride.dropoff_lat));
  if (ride.dropoff_lon != null) params.set("to_lon", String(ride.dropoff_lon));
  if (ride.vehicle_type) params.set("vehicle", ride.vehicle_type);
  if (ride.options?.length) params.set("options", ride.options.join(","));
  return `/reservation?${params.toString()}`;
}

/** Strip legacy cancel lines still embedded in pickup_notes. */
export function cleanPickupNotes(notes: string | null | undefined): string | null {
  if (!notes) return null;
  const cleaned = notes
    .split("\n")
    .filter((line) => {
      const trimmed = line.trimStart();
      return (
        !trimmed.startsWith("[system-expire]") &&
        !trimmed.startsWith("[admin-cancel]")
      );
    })
    .join("\n")
    .trim();
  return cleaned.length > 0 ? cleaned : null;
}

export function formatPersonName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
): string {
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();
  return name || "—";
}
