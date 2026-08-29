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
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

function isLocalhostOrigin(origin: string): boolean {
  return /\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
}

/** True for deploy-preview hosts (SSO-protected) vs stable production vercel.app. */
export function isLikelyVercelPreviewHost(hostname: string): boolean {
  // e.g. elegance-mobility-xxxxx-jawjawws-projects.vercel.app
  return /vercel\.app$/i.test(hostname) && hostname.split(".").length >= 4;
}

/**
 * PKCE stores code_verifier on the current origin. Email redirect must use that
 * same origin, otherwise exchangeCodeForSession fails even in the "same browser".
 */
export function getPkceSafeAuthRedirectOrigin(): {
  origin: string | null;
  error: string | null;
} {
  if (typeof window === "undefined") {
    return { origin: null, error: "Navigateur requis." };
  }

  const current = window.location.origin.replace(/\/$/, "");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");

  if (isLocalhostOrigin(current)) {
    return { origin: current, error: null };
  }

  if (isLikelyVercelPreviewHost(window.location.hostname)) {
    const prod = siteUrl ?? "https://elegance-mobility.vercel.app";
    return {
      origin: null,
      error: `Pour réinitialiser votre mot de passe, ouvrez ${prod}/auth/forgot-password (pas une URL preview Vercel).`,
    };
  }

  // Prefer current origin so PKCE code_verifier matches the email redirect.
  return { origin: current, error: null };
}

export function buildPkceSafeAuthRedirectPath(path: string): {
  url: string | null;
  error: string | null;
} {
  const { origin, error } = getPkceSafeAuthRedirectOrigin();
  if (error || !origin) return { url: null, error: error ?? "Origine invalide." };
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return {
    url: `${origin}${normalized}`,
    error: null,
  };
}
