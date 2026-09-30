/**
 * Which bottom-nav entry owns the current path.
 *
 * The nav answered per entry with `pathname === href || pathname.startsWith(href + '/')`, which is
 * fine until two entries are nested — and `Compte` (`/my-account`) is the parent of
 * `Mes réservations` (`/my-account/reservations`). Both matched there, so the account icon stayed
 * blue while the customer was reading their reservations, and it stayed blue on every subpage of
 * the section while the tab that owns those pages was `Mes réservations`.
 *
 * One entry has to win, and the longest declared prefix is the one that means it: a page is owned
 * by the most specific tab that claims it. `Compte` therefore keeps `/my-account` and the pages
 * nobody else claims (profile, password, notifications, settings), without ever lighting up for a
 * page another tab named more precisely.
 *
 * A single answer also makes "exactly one tab is active" a property of the rule rather than
 * something four independent comparisons happen to agree on.
 */

/** One trailing slash removed, except for the root — Next may or may not keep them. */
function normalizeNavPath(pathname: string): string {
  if (pathname.length <= 1 || !pathname.endsWith('/')) return pathname;
  return pathname.slice(0, -1) || '/';
}

/**
 * Whether a single entry claims a path.
 *
 * Two cases rather than one on purpose: the root must not be treated as a prefix, or `Accueil`
 * would be active on every page of the app — `'/'.length` is 1 and every path starts with it.
 */
export function navHrefOwnsPath(pathname: string, href: string): boolean {
  const path = normalizeNavPath(pathname);
  if (href === '/') return path === '/';
  return path === href || path.startsWith(`${href}/`);
}

/** The entry that owns the path, or `null` when no tab does. */
export function resolveActiveNavHref(
  pathname: string,
  hrefs: readonly string[],
): string | null {
  let active: string | null = null;
  for (const href of hrefs) {
    if (!navHrefOwnsPath(pathname, href)) continue;
    if (active === null || href.length > active.length) active = href;
  }
  return active;
}
