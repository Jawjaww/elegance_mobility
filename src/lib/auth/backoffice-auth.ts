export const BACKOFFICE_LOGIN_PATH = "/backoffice-portal/login";
export const BACKOFFICE_DEFAULT_PATH = "/backoffice-portal/dashboard";

/** True for /backoffice-portal/login (with or without query string). */
export function isBackofficeLoginPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return (
    pathname === BACKOFFICE_LOGIN_PATH ||
    pathname.startsWith(`${BACKOFFICE_LOGIN_PATH}?`) ||
    pathname.startsWith(`${BACKOFFICE_LOGIN_PATH}/`)
  );
}

/** True for any backoffice route that requires an admin session. */
export function isBackofficeProtectedPath(
  pathname: string | null | undefined,
): boolean {
  if (!pathname?.startsWith("/backoffice-portal")) return false;
  return !isBackofficeLoginPath(pathname);
}

/**
 * Sanitize post-login redirect target: internal backoffice paths only, never login.
 */
export function sanitizeBackofficeNextPath(
  next: string | null | undefined,
): string | null {
  if (!next?.trim()) return null;
  const path = next.trim();
  if (!path.startsWith("/backoffice-portal/")) return null;
  if (isBackofficeLoginPath(path)) return null;
  if (path.startsWith("//")) return null;
  return path;
}

export function buildBackofficeLoginUrl(returnPath: string): string {
  const safeReturn = sanitizeBackofficeNextPath(returnPath) ?? returnPath;
  if (!safeReturn.startsWith("/backoffice-portal/") || isBackofficeLoginPath(safeReturn)) {
    return BACKOFFICE_LOGIN_PATH;
  }
  return `${BACKOFFICE_LOGIN_PATH}?next=${encodeURIComponent(safeReturn)}`;
}

export function resolveBackofficePostLoginPath(
  next: string | null | undefined,
): string {
  return sanitizeBackofficeNextPath(next) ?? BACKOFFICE_DEFAULT_PATH;
}
