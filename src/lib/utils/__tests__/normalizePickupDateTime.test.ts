import {
  asapPickupDateTime,
  normalizePickupDateTime,
  RESERVATION_MIN_LEAD_MS,
} from '../normalizePickupDateTime';

describe('normalizePickupDateTime', () => {
  const now = new Date('2026-08-25T12:00:00.000Z');

  it('bumps past times to now + min lead', () => {
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

  it('bumps a pickup inside the min lead to now + 15 min', () => {
    const soon = new Date('2026-08-25T12:10:00.000Z');
    const result = normalizePickupDateTime(soon, now);
    expect(result.toISOString()).toBe('2026-08-25T12:15:00.000Z');
  });
});

describe('asapPickupDateTime', () => {
  it('returns now + min lead', () => {
    const now = new Date('2026-08-25T12:00:00.000Z');
    expect(asapPickupDateTime(now).toISOString()).toBe(
      '2026-08-25T12:15:00.000Z',
    );
  });
});
