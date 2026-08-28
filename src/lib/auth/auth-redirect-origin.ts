/** Stable public origin for Supabase email links (avoid preview SSO URLs). */
export function getAuthRedirectOrigin(fallbackOrigin?: string): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return fallbackOrigin?.replace(/\/$/, "") ?? "http://localhost:3000";
}

export function buildAuthRedirectPath(path: string, origin?: string): string {
  const base = origin ?? getAuthRedirectOrigin();
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
