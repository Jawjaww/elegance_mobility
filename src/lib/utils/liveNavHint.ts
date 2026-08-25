const LIVE_NAV_MAX_AGE_MS = 3 * 60 * 1000;

export function formatLiveRemaining(meters: number): string {
  if (!Number.isFinite(meters) || meters < 0) return '';
  if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
  return `${Math.round(meters)} m`;
}

/** Fresh live ETA line for client reservation cards, or null if stale/missing. */
export function formatLiveNavHint(ride: {
  status?: string | null;
  live_eta_minutes?: number | null;
  live_remaining_m?: number | null;
  nav_updated_at?: string | null;
}): string | null {
  if (ride.status !== 'scheduled' && ride.status !== 'in-progress') {
    return null;
  }
  if (ride.live_eta_minutes == null && ride.live_remaining_m == null) {
    return null;
  }
  if (!ride.nav_updated_at) return null;
  const updated = new Date(ride.nav_updated_at).getTime();
  if (!Number.isFinite(updated) || Date.now() - updated > LIVE_NAV_MAX_AGE_MS) {
    return null;
  }
  const parts: string[] = [];
  if (ride.live_eta_minutes != null) {
    parts.push(`~${ride.live_eta_minutes} min`);
  }
  if (ride.live_remaining_m != null) {
    const dist = formatLiveRemaining(ride.live_remaining_m);
    if (dist) parts.push(dist);
  }
  return parts.length ? parts.join(' · ') : null;
}
