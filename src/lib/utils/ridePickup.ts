/** Default matching heartbeat after pickup_time — must match infra snapshot. */
export const RIDE_MATCHING_WINDOW_MS = 20 * 60 * 1000;

/** Pause at deadline; one silence of the same length then system expire. */
export const RIDE_MATCHING_SOFT_CONFIRM_MS = 20 * 60 * 1000;

/** @deprecated Use RIDE_MATCHING_WINDOW_MS — kept for call-site compat */
export const RIDE_PICKUP_GRACE_MS = RIDE_MATCHING_WINDOW_MS;

export type RideMatchingFields = {
  pickup_time?: string | null;
  matching_deadline_at?: string | null;
  matching_paused_at?: string | null;
  status?: string | null;
};

/** ISO cutoff for legacy `.gt('pickup_time', cutoff)` filters */
export function ridePickupExpiryCutoffIso(
  graceMs: number = RIDE_MATCHING_WINDOW_MS,
): string {
  return new Date(Date.now() - graceMs).toISOString();
}

export function resolveMatchingDeadlineMs(
  pickupTime: string | null | undefined,
  matchingDeadlineAt?: string | null,
  windowMs: number = RIDE_MATCHING_WINDOW_MS,
): number | null {
  if (matchingDeadlineAt) {
    const d = new Date(matchingDeadlineAt).getTime();
    return Number.isNaN(d) ? null : d;
  }
  if (!pickupTime) return null;
  const t = new Date(pickupTime).getTime();
  if (Number.isNaN(t)) return null;
  return t + windowMs;
}

/** Whether a pending/delayed ride can still be offered to drivers */
export function isRideStillOfferable(
  ride: RideMatchingFields,
  nowMs: number = Date.now(),
): boolean {
  if (ride.matching_paused_at) return false;
  if (
    ride.status != null &&
    ride.status !== 'pending' &&
    ride.status !== 'delayed'
  ) {
    return false;
  }
  const deadline = resolveMatchingDeadlineMs(
    ride.pickup_time,
    ride.matching_deadline_at,
  );
  if (deadline == null) return false;
  return deadline > nowMs;
}

/**
 * Legacy helper: offerable if pickup_time is within grace of now.
 * Prefer isRideStillOfferable when matching_deadline_at is available.
 */
export function isRidePickupStillOfferable(
  pickupTime: string | null | undefined,
  graceMs: number = RIDE_MATCHING_WINDOW_MS,
): boolean {
  if (!pickupTime) return false;
  const t = new Date(pickupTime).getTime();
  if (Number.isNaN(t)) return false;
  return t >= Date.now() - graceMs;
}

/** UI label for pending/delayed rides */
export function getPendingRideDisplayLabel(
  pickupTime: string | null | undefined,
  matchingDeadlineAt?: string | null,
  matchingPausedAt?: string | null,
): string {
  if (matchingPausedAt) return 'Confirmez la recherche';
  const deadline = resolveMatchingDeadlineMs(pickupTime, matchingDeadlineAt);
  if (deadline == null) return 'En attente';
  if (deadline <= Date.now()) return 'Recherche expirée';
  if (!pickupTime) return 'En attente';
  const pickup = new Date(pickupTime).getTime();
  if (!Number.isNaN(pickup) && pickup < Date.now()) {
    return 'En recherche (retard matching)';
  }
  return 'En attente';
}
