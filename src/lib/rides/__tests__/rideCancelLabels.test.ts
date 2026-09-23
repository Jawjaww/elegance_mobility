import {
  adminMatchingBadgeOverride,
  buildRebookHref,
  cancelBadgeLabel,
  cancelBillingLabel,
  cancelChipWithBilling,
  canceledByLabel,
  cancelReasonCodeLabel,
  canClientCancelRide,
  clientStatusBadgeOverride,
  cleanPickupNotes,
  delayKindLabel,
  isSystemExpiredRide,
  shouldShowAdminMatchingFlameBadge,
  vehicleTypeDisplayName,
} from '../rideCancelLabels';

describe('rideCancelLabels', () => {
  it('maps canceled_by to French labels', () => {
    expect(canceledByLabel('system')).toBe('Système — aucun chauffeur');
    expect(canceledByLabel('admin')).toBe('Administrateur');
  });

  it('builds short list badges', () => {
    expect(cancelBadgeLabel('admin-canceled', 'system')).toBe(
      'Expirée — aucun chauffeur',
    );
    expect(cancelBadgeLabel('admin-canceled', 'admin')).toBe('Annulée admin');
    expect(cancelBadgeLabel('pending', null)).toBeNull();
  });

  it('maps cancel billing policy labels', () => {
    expect(cancelBillingLabel('none')).toBe('Aucun frais');
    expect(cancelBillingLabel('client_fee')).toBe('Frais applicables');
    expect(cancelBillingLabel('waive')).toBe('Frais annulés');
  });

  it('builds client and admin badge overrides', () => {
    expect(
      clientStatusBadgeOverride('delayed', 'En recherche', null, false),
    ).toBe('En recherche');
    expect(
      clientStatusBadgeOverride(
        'admin-canceled',
        'Annulée',
        'Expirée — aucun chauffeur',
        true,
      ),
    ).toBe('Expirée — aucun chauffeur');
    expect(adminMatchingBadgeOverride(null, 'pending', null)).toBeNull();
    expect(
      adminMatchingBadgeOverride('2026-09-10T12:00:00Z', 'delayed', 'matching'),
    ).toBe('Recherche en pause');
    expect(adminMatchingBadgeOverride(null, 'delayed', 'matching')).toBeNull();
    expect(
      shouldShowAdminMatchingFlameBadge(null, 'delayed', 'matching'),
    ).toBe(true);
    expect(
      shouldShowAdminMatchingFlameBadge('2026-09-10T12:00:00Z', 'delayed', 'matching'),
    ).toBe(false);
  });

  it('reads the matching window, not just the status, for the admin badge', () => {
    // The deadline is the arbiter: an expired window is not "En recherche" any more.
    const past = Date.now() - 5 * 60_000;
    const pickupTime = new Date(past).toISOString();
    const expired = new Date(Date.now() - 60_000).toISOString();
    const open = new Date(Date.now() + 60_000).toISOString();

    expect(
      shouldShowAdminMatchingFlameBadge(null, 'delayed', 'matching', pickupTime, open),
    ).toBe(true);
    expect(
      adminMatchingBadgeOverride(null, 'delayed', 'matching', pickupTime, open),
    ).toBeNull();

    expect(
      shouldShowAdminMatchingFlameBadge(
        null,
        'delayed',
        'matching',
        pickupTime,
        expired,
      ),
    ).toBe(false);
    expect(
      adminMatchingBadgeOverride(null, 'delayed', 'matching', pickupTime, expired),
    ).toBe('Recherche expirée');
    expect(
      adminMatchingBadgeOverride(null, 'delayed', 'matching', pickupTime, expired),
    ).not.toBe('En recherche');

    // A ride matching no longer applies to stays silent, whatever the deadline says.
    expect(
      shouldShowAdminMatchingFlameBadge(null, 'completed', null, pickupTime, open),
    ).toBe(false);
    expect(
      adminMatchingBadgeOverride(null, 'completed', null, pickupTime, expired),
    ).toBeNull();

    // Pause wins over everything.
    expect(
      shouldShowAdminMatchingFlameBadge(expired, 'delayed', 'matching', pickupTime, open),
    ).toBe(false);
    expect(
      adminMatchingBadgeOverride(expired, 'delayed', 'matching', pickupTime, open),
    ).toBe('Recherche en pause');

    // No pickup time: keep the status-only signal rather than dropping the badge.
    expect(shouldShowAdminMatchingFlameBadge(null, 'delayed', 'matching')).toBe(true);
    expect(adminMatchingBadgeOverride(null, 'delayed', 'matching')).toBeNull();
  });

  it('maps delay kind and vehicle display names', () => {
    expect(delayKindLabel('matching')).toBe('Matching (pas de chauffeur)');
    expect(delayKindLabel(null)).toBe('—');
    expect(vehicleTypeDisplayName(null)).toBe('Trajet VTC');
    expect(vehicleTypeDisplayName('PREMIUM')).toBe('Premium');
    expect(isSystemExpiredRide('admin-canceled', 'system')).toBe(true);
    expect(isSystemExpiredRide('admin-canceled', 'admin')).toBe(false);
    expect(
      cancelChipWithBilling('Expirée — aucun chauffeur', 'none'),
    ).toBe('Expirée — aucun chauffeur · Aucun frais');
  });

  it('maps cancel reason codes and client-cancel statuses', () => {
    expect(cancelReasonCodeLabel('client_cancel_en_route')).toBe(
      'Chauffeur déjà en route',
    );
    expect(canClientCancelRide('scheduled')).toBe(true);
    expect(canClientCancelRide('in-progress')).toBe(false);
  });

  it('builds rebook href with addresses and vehicle', () => {
    const href = buildRebookHref({
      pickup_address: 'A',
      dropoff_address: 'B',
      pickup_lat: 48.8,
      pickup_lon: 2.3,
      vehicle_type: 'STANDARD',
      options: ['wifi'],
    });
    expect(href).toContain('/reservation?');
    expect(href).toContain('rebook=1');
    expect(href).toContain('from=A');
    expect(href).toContain('to=B');
    expect(href).toContain('vehicle=STANDARD');
    expect(href).toContain('options=wifi');
  });

  it('strips legacy cancel prefixes from pickup_notes', () => {
    expect(
      cleanPickupNotes(
        'Code portail 12\n[system-expire] Course expirée (pickup_time dépassé, non assignée)',
      ),
    ).toBe('Code portail 12');
    expect(cleanPickupNotes('[admin-cancel] Motif test')).toBeNull();
    expect(
      cleanPickupNotes(
        'Note A\n  [admin-cancel] x\nNote B',
      ),
    ).toBe('Note A\nNote B');
  });
});
