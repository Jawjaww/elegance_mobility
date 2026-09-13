/** Minimum lead time for a new/reused reservation pickup (matches DateTimeStep min). */
export const RESERVATION_MIN_LEAD_MS = 15 * 60 * 1000;

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

function atMinutePrecision(date: Date): Date {
  const next = new Date(date);
  next.setSeconds(0, 0);
  return next;
}

/**
 * If `date` is before now + min lead, bump to now + min lead (minute precision).
 * Used when restoring a draft on create (not edit).
 */
export function normalizePickupDateTime(
  date: Date | string | null | undefined,
  now: Date = new Date(),
): Date {
  const base = parsePickupInput(date, now);

  if (Number.isNaN(base.getTime())) {
    return atMinutePrecision(new Date(now.getTime() + RESERVATION_MIN_LEAD_MS));
  }

  const min = atMinutePrecision(new Date(now.getTime() + RESERVATION_MIN_LEAD_MS));

  if (base < min) {
    return min;
  }

  return atMinutePrecision(base);
}

/** Pickup at the earliest bookable time (now + min lead). */
export function asapPickupDateTime(now: Date = new Date()): Date {
  return normalizePickupDateTime(now, now);
}
