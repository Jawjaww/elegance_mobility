export type RideOfferRealtimeRow = {
  ride_id: string;
  driver_id: string;
  status: string;
  expires_at?: string | null;
};

export function isOpenRideOffer(
  row: RideOfferRealtimeRow,
  nowMs = Date.now(),
): boolean {
  if (row.status !== "offered") return false;
  if (!row.expires_at) return true;
  return new Date(row.expires_at).getTime() > nowMs;
}

/** Server closed this driver's offer — drop it from the overlay. */
export function shouldDropOverlayForOfferStatus(status: string): boolean {
  return (
    status === "timeout" ||
    status === "expired_taken" ||
    status === "declined"
  );
}
