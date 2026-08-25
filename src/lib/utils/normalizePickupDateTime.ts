/** Minimum lead time for a new/reused reservation pickup (matches DateTimeStep min). */
export const RESERVATION_MIN_LEAD_MS = 60 * 60 * 1000;

function parsePickupInput(
  date: Date | string | null | undefined,
  now: Date,
): Date {
  if (date instanceof Date) {
    return new Date(date);
  }
  if (typeof date === 'string') {
    return new Date(date);
  }
  return new Date(now);
}

/**
 * If `date` is before now + 1h, bump to now + 1h (minute precision).
 * Used when restoring a draft on create (not edit).
 */
export function normalizePickupDateTime(
  date: Date | string | null | undefined,
  now: Date = new Date(),
): Date {
  const base = parsePickupInput(date, now);

  if (Number.isNaN(base.getTime())) {
    const fallback = new Date(now.getTime() + RESERVATION_MIN_LEAD_MS);
    fallback.setSeconds(0, 0);
    return fallback;
  }

  const min = new Date(now.getTime() + RESERVATION_MIN_LEAD_MS);
  min.setSeconds(0, 0);

  if (base < min) {
    return min;
  }

  base.setSeconds(0, 0);
  return base;
}
