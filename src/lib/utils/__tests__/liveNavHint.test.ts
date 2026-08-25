import { formatLiveNavHint, formatLiveRemaining } from '../liveNavHint';

describe('liveNavHint', () => {
  it('formatLiveRemaining switches units', () => {
    expect(formatLiveRemaining(400)).toBe('400 m');
    expect(formatLiveRemaining(2400)).toBe('2.4 km');
  });

  it('formatLiveNavHint returns null when stale', () => {
    const stale = new Date(Date.now() - 10 * 60_000).toISOString();
    expect(
      formatLiveNavHint({
        status: 'in-progress',
        live_eta_minutes: 5,
        live_remaining_m: 1200,
        nav_updated_at: stale,
      }),
    ).toBeNull();
  });

  it('formatLiveNavHint formats fresh scheduled/in-progress', () => {
    const fresh = new Date().toISOString();
    expect(
      formatLiveNavHint({
        status: 'scheduled',
        live_eta_minutes: 4,
        live_remaining_m: 900,
        nav_updated_at: fresh,
      }),
    ).toBe('~4 min · 900 m');
  });
});
