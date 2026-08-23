import {
  cancelBadgeLabel,
  canceledByLabel,
  cleanPickupNotes,
} from '../rideCancelLabels';

describe('rideCancelLabels', () => {
  it('maps canceled_by to French labels', () => {
    expect(canceledByLabel('system')).toBe('Système — expiration');
    expect(canceledByLabel('admin')).toBe('Administrateur');
  });

  it('builds short list badges', () => {
    expect(cancelBadgeLabel('admin-canceled', 'system')).toBe('Expirée');
    expect(cancelBadgeLabel('admin-canceled', 'admin')).toBe('Annulée admin');
    expect(cancelBadgeLabel('pending', null)).toBeNull();
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
