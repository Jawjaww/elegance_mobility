import {
  normalizePickupDateTime,
  RESERVATION_MIN_LEAD_MS,
} from '../normalizePickupDateTime';

describe('normalizePickupDateTime', () => {
  const now = new Date('2026-08-25T12:00:00.000Z');

  it('bumps past times to now + 1h', () => {
    const past = new Date('2026-08-25T10:00:00.000Z');
    const result = normalizePickupDateTime(past, now);
    expect(result.getTime()).toBe(now.getTime() + RESERVATION_MIN_LEAD_MS);
  });

  it('keeps future times beyond min lead', () => {
    const future = new Date('2026-08-25T18:00:00.000Z');
    const result = normalizePickupDateTime(future, now);
    expect(result.toISOString()).toBe('2026-08-25T18:00:00.000Z');
  });

  it('accepts ISO strings', () => {
    const result = normalizePickupDateTime('2026-08-25T10:30:00.000Z', now);
    expect(result.getTime()).toBe(now.getTime() + RESERVATION_MIN_LEAD_MS);
  });
});
