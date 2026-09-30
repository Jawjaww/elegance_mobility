import { navHrefOwnsPath, resolveActiveNavHref } from '../bottomNavActive';

/** The four entries of the client bottom nav, in render order. */
const CLIENT_NAV = ['/', '/reservation', '/my-account/reservations', '/my-account'];

describe('navHrefOwnsPath', () => {
  it('claims the exact page and everything under it', () => {
    expect(navHrefOwnsPath('/my-account', '/my-account')).toBe(true);
    expect(navHrefOwnsPath('/my-account/settings', '/my-account')).toBe(true);
    expect(navHrefOwnsPath('/my-account/reservations', '/my-account/reservations')).toBe(true);
    expect(navHrefOwnsPath('/reservation/success', '/reservation')).toBe(true);
  });

  it('does not claim a sibling that merely starts with the same letters', () => {
    expect(navHrefOwnsPath('/reservations', '/reservation')).toBe(false);
    expect(navHrefOwnsPath('/reservation-2', '/reservation')).toBe(false);
    expect(navHrefOwnsPath('/my-accounting', '/my-account')).toBe(false);
  });

  it('treats the root as an exact match and never as a prefix', () => {
    // The bug this guards: `'/'.length` is 1 and every path starts with it, so a prefix rule for
    // the root puts `Accueil` in the active state on every page of the app.
    expect(navHrefOwnsPath('/', '/')).toBe(true);
    expect(navHrefOwnsPath('/my-account', '/')).toBe(false);
    expect(navHrefOwnsPath('/reservation', '/')).toBe(false);
  });

  it('ignores a trailing slash', () => {
    expect(navHrefOwnsPath('/my-account/', '/my-account')).toBe(true);
    expect(navHrefOwnsPath('/', '/')).toBe(true);
    // A doubled slash survives normalization and is still claimed, through the prefix branch.
    expect(navHrefOwnsPath('/my-account//', '/my-account')).toBe(true);
  });
});

describe('resolveActiveNavHref', () => {
  it('gives the reservations page to its own tab, not to Compte', () => {
    // The report: on the reservations tab, the account icon stayed blue. `/my-account` matched as
    // a prefix, so two tabs were lit at once and the account one never went back to rest.
    expect(resolveActiveNavHref('/my-account/reservations', CLIENT_NAV)).toBe(
      '/my-account/reservations',
    );
    expect(resolveActiveNavHref('/my-account/reservations/edit', CLIENT_NAV)).toBe(
      '/my-account/reservations',
    );
    expect(resolveActiveNavHref('/my-account/reservations/9f2/edit', CLIENT_NAV)).toBe(
      '/my-account/reservations',
    );
  });

  it('keeps the account pages nobody else claims on Compte', () => {
    expect(resolveActiveNavHref('/my-account', CLIENT_NAV)).toBe('/my-account');
    expect(resolveActiveNavHref('/my-account/settings', CLIENT_NAV)).toBe('/my-account');
    expect(resolveActiveNavHref('/my-account/password', CLIENT_NAV)).toBe('/my-account');
    expect(resolveActiveNavHref('/my-account/notifications', CLIENT_NAV)).toBe('/my-account');
  });

  it('answers with the most specific entry, whatever the order of the entries', () => {
    // Non-vacuity: the nesting is real, so the resolver is discriminating between two claimants
    // rather than picking the only one that matches.
    const nested = '/my-account/reservations';
    expect(CLIENT_NAV.filter((href) => navHrefOwnsPath(nested, href))).toEqual([
      '/my-account/reservations',
      '/my-account',
    ]);

    // Order-independence is the point of "longest wins": the resolver is handed the list and
    // cannot rely on the nested entry being declared first.
    for (const path of ['/', '/reservation', '/my-account', nested]) {
      const reversed = [...CLIENT_NAV].reverse();
      expect(resolveActiveNavHref(path, reversed)).toBe(
        resolveActiveNavHref(path, CLIENT_NAV),
      );
    }
  });

  it('answers null where no tab claims the page', () => {
    expect(resolveActiveNavHref('/rates', CLIENT_NAV)).toBeNull();
    expect(resolveActiveNavHref('/contact', CLIENT_NAV)).toBeNull();
    // Still null rather than `Accueil`: the root is an exact match only.
    expect(resolveActiveNavHref('/auth/login', CLIENT_NAV)).toBeNull();
  });

  it('lights up exactly one entry, and it is one of the entries that claimed the page', () => {
    for (const path of [
      '/',
      '/reservation',
      '/reservation/success',
      '/my-account',
      '/my-account/settings',
      '/my-account/reservations',
      '/my-account/reservations/edit-confirmation',
    ]) {
      const active = resolveActiveNavHref(path, CLIENT_NAV);
      expect(CLIENT_NAV).toContain(active);
      expect(navHrefOwnsPath(path, active!)).toBe(true);
      // A single answer is the whole guarantee — the bar renders one active class from it, so no
      // page can light two tabs the way `/my-account/reservations` used to.
      expect(CLIENT_NAV.filter((href) => href === active)).toHaveLength(1);
    }
  });
});
