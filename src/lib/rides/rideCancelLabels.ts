/** Helpers for ride cancellation display (backoffice). */

export type CanceledBy = "system" | "admin" | "client" | "driver";

const CANCELED_BY_LABELS: Record<CanceledBy, string> = {
  system: "Système — expiration",
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
  if (canceledBy === "system") return "Expirée";
  if (canceledBy === "admin") return "Annulée admin";
  if (canceledBy === "client") return "Annulée client";
  if (canceledBy === "driver") return "Annulée chauffeur";
  if (status === "admin-canceled") return "Annulée admin";
  if (status === "client-canceled") return "Annulée client";
  if (status === "driver-canceled") return "Annulée chauffeur";
  return "Annulée";
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
