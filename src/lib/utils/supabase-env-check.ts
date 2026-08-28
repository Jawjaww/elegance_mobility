export type SupabaseEnvReport = {
  ok: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  urlHost: string | null;
  keyProjectRef: string | null;
  refsMatch: boolean;
  isLocalhost: boolean;
  anonKeyFormat: "jwt" | "publishable" | "unknown" | "missing";
  message: string | null;
};

function projectRefFromUrl(url: string): string | null {
  const match = /^https:\/\/([^.]+)\.supabase\.co\/?$/i.exec(url.trim());
  return match?.[1] ?? null;
}

function projectRefFromJwtAnonKey(key: string): string | null {
  const parts = key.trim().split(".");
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(parts[1], "base64url").toString("utf8"),
    ) as { ref?: string };
    return payload.ref ?? null;
  } catch {
    return null;
  }
}

/** Validates public Supabase env without exposing secret values. */
export function inspectSupabasePublicEnv(
  rawUrl?: string,
  rawAnonKey?: string,
): SupabaseEnvReport {
  const url = rawUrl?.trim() ?? "";
  const anonKey = rawAnonKey?.trim() ?? "";
  const hasUrl = url.length > 0;
  const hasAnonKey = anonKey.length > 0;
  const isLocalhost = /127\.0\.0\.1|localhost/.test(url);
  const urlHost = hasUrl ? projectRefFromUrl(url) : null;

  let anonKeyFormat: SupabaseEnvReport["anonKeyFormat"] = "missing";
  if (hasAnonKey) {
    if (anonKey.startsWith("eyJ")) anonKeyFormat = "jwt";
    else if (anonKey.startsWith("sb_publishable_")) anonKeyFormat = "publishable";
    else anonKeyFormat = "unknown";
  }

  const keyProjectRef =
    anonKeyFormat === "jwt" ? projectRefFromJwtAnonKey(anonKey) : null;
  const refsMatch =
    !!urlHost && !!keyProjectRef ? urlHost === keyProjectRef : false;

  let message: string | null = null;
  if (!hasUrl || !hasAnonKey) {
    message =
      "Variables Supabase manquantes sur ce déploiement. Redéployez après avoir défini NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (Preview + Production).";
  } else if (isLocalhost) {
    message =
      "NEXT_PUBLIC_SUPABASE_URL pointe vers localhost — utilisez l'URL cloud du projet.";
  } else if (anonKeyFormat === "unknown") {
    message =
      "Format de clé anon non reconnu. Utilisez la clé « anon public » (JWT eyJ…) du dashboard Supabase.";
  } else if (anonKeyFormat === "jwt" && urlHost && keyProjectRef && !refsMatch) {
    message = `Incohérence Supabase : l'URL (${urlHost}) ne correspond pas à la clé anon (${keyProjectRef}).`;
  } else if (anonKeyFormat === "jwt" && !keyProjectRef) {
    message = "Clé anon JWT illisible ou invalide.";
  }

  const ok =
    hasUrl &&
    hasAnonKey &&
    !isLocalhost &&
    anonKeyFormat !== "unknown" &&
    (anonKeyFormat !== "jwt" || refsMatch);

  return {
    ok,
    hasUrl,
    hasAnonKey,
    urlHost,
    keyProjectRef,
    refsMatch,
    isLocalhost,
    anonKeyFormat,
    message,
  };
}
