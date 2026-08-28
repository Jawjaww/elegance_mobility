export type SupabaseEnvReport = {
  ok: boolean;
  hasUrl: boolean;
  hasAnonKey: boolean;
  urlHost: string | null;
  keyProjectRef: string | null;
  refsMatch: boolean;
  isLocalhost: boolean;
  anonKeyFormat: "jwt" | "publishable" | "unknown" | "missing";
  jwtSegmentCount: number;
  anonKeyLength: number;
  jwtIssuer: string | null;
  message: string | null;
};

type AnonKeyFormat = SupabaseEnvReport["anonKeyFormat"];

export function normalizeAnonKey(raw: string): string {
  return raw.trim().replace(/^["']|["']$/g, "").replaceAll(/\s+/g, "");
}

function decodeJwtPayloadSegment(segment: string): Record<string, unknown> | null {
  const base64 = segment.replaceAll("-", "+").replaceAll("_", "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  for (const encoding of ["base64", "base64url"] as const) {
    try {
      return JSON.parse(
        Buffer.from(encoding === "base64" ? padded : segment, encoding).toString(
          "utf8",
        ),
      ) as Record<string, unknown>;
    } catch {
      /* try next encoding */
    }
  }
  return null;
}

function projectRefFromUrl(url: string): string | null {
  const match = /^https:\/\/([^.]+)\.supabase\.co\/?$/i.exec(url.trim());
  return match?.[1] ?? null;
}

function projectRefFromJwtAnonKey(key: string): string | null {
  const parts = normalizeAnonKey(key).split(".");
  if (parts.length !== 3) return null;
  const payload = decodeJwtPayloadSegment(parts[1]);
  const ref = payload?.ref;
  return typeof ref === "string" ? ref : null;
}

function jwtIssuerFromAnonKey(key: string): string | null {
  const parts = normalizeAnonKey(key).split(".");
  if (parts.length !== 3) return null;
  const payload = decodeJwtPayloadSegment(parts[1]);
  const iss = payload?.iss;
  return typeof iss === "string" ? iss : null;
}

function detectAnonKeyFormat(anonKey: string): AnonKeyFormat {
  if (!anonKey) return "missing";
  if (anonKey.startsWith("eyJ")) return "jwt";
  if (anonKey.startsWith("sb_publishable_")) return "publishable";
  return "unknown";
}

function invalidJwtKeyMessage(input: {
  jwtIssuer: string | null;
  anonKeyLength: number;
  isLocalhost: boolean;
  jwtSegmentCount: number;
  urlHost: string | null;
}): string {
  const { jwtIssuer, anonKeyLength, isLocalhost, jwtSegmentCount, urlHost } =
    input;

  if (jwtIssuer === "supabase-demo" || (anonKeyLength > 220 && !isLocalhost)) {
    return `Clé anon locale détectée (issuer « ${jwtIssuer ?? "inconnu"} », ${anonKeyLength} car.) — ne pas copier depuis .env.local. Utilisez la clé « anon public » du dashboard Supabase cloud (projet ${urlHost ?? "iodsddzustunlahxafif"}, ~208 car., issuer « supabase »).`;
  }

  const lengthHint = anonKeyLength > 0 ? ` (${anonKeyLength} caractères` : "";
  const segmentHint =
    jwtSegmentCount > 0 ? `, ${jwtSegmentCount} segment(s) JWT` : "";
  const suffix =
    lengthHint || segmentHint
      ? `${lengthHint}${segmentHint}; attendu ~208 car., 3 segments)`
      : "";

  return `Clé anon JWT illisible ou invalide${suffix}. Supprimez NEXT_PUBLIC_SUPABASE_ANON_KEY sur Vercel, recopiez la clé « anon public » depuis Supabase → Project Settings → API (sans guillemets), cochez Preview + Production, puis redéployez.`;
}

function messageForJwtEnv(input: {
  anonKeyFormat: AnonKeyFormat;
  jwtSegmentCount: number;
  anonKeyLength: number;
  jwtIssuer: string | null;
  isLocalhost: boolean;
  urlHost: string | null;
  keyProjectRef: string | null;
  refsMatch: boolean;
}): string | null {
  const {
    anonKeyFormat,
    jwtSegmentCount,
    anonKeyLength,
    jwtIssuer,
    isLocalhost,
    urlHost,
    keyProjectRef,
    refsMatch,
  } = input;

  if (anonKeyFormat !== "jwt") return null;
  if (jwtSegmentCount !== 3) {
    return `Clé anon tronquée (${jwtSegmentCount} segment(s) JWT au lieu de 3). Recopiez la clé complète depuis Supabase → API → anon public.`;
  }
  if (urlHost && keyProjectRef && !refsMatch) {
    return `Incohérence Supabase : l'URL (${urlHost}) ne correspond pas à la clé anon (${keyProjectRef}).`;
  }
  if (!keyProjectRef) {
    return invalidJwtKeyMessage({
      jwtIssuer,
      anonKeyLength,
      isLocalhost,
      jwtSegmentCount,
      urlHost,
    });
  }
  return null;
}

function resolveSupabaseEnvMessage(input: {
  hasUrl: boolean;
  hasAnonKey: boolean;
  isLocalhost: boolean;
  anonKeyFormat: AnonKeyFormat;
  jwtSegmentCount: number;
  anonKeyLength: number;
  jwtIssuer: string | null;
  urlHost: string | null;
  keyProjectRef: string | null;
  refsMatch: boolean;
}): string | null {
  const { hasUrl, hasAnonKey, isLocalhost, anonKeyFormat } = input;

  if (!hasUrl || !hasAnonKey) {
    return "Variables Supabase manquantes sur ce déploiement. Redéployez après avoir défini NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY (Preview + Production).";
  }
  if (isLocalhost) {
    return "NEXT_PUBLIC_SUPABASE_URL pointe vers localhost — utilisez l'URL cloud du projet.";
  }
  if (anonKeyFormat === "unknown") {
    return "Format de clé anon non reconnu. Utilisez la clé « anon public » (JWT eyJ…) du dashboard Supabase.";
  }

  return messageForJwtEnv(input);
}

/** Validates public Supabase env without exposing secret values. */
export function inspectSupabasePublicEnv(
  rawUrl?: string,
  rawAnonKey?: string,
): SupabaseEnvReport {
  const url = rawUrl?.trim() ?? "";
  const anonKey = normalizeAnonKey(rawAnonKey ?? "");
  const hasUrl = url.length > 0;
  const hasAnonKey = anonKey.length > 0;
  const jwtSegmentCount = anonKey ? anonKey.split(".").length : 0;
  const anonKeyLength = anonKey.length;
  const isLocalhost = /127\.0\.0\.1|localhost/.test(url);
  const urlHost = hasUrl ? projectRefFromUrl(url) : null;
  const anonKeyFormat = detectAnonKeyFormat(anonKey);
  const keyProjectRef =
    anonKeyFormat === "jwt" ? projectRefFromJwtAnonKey(anonKey) : null;
  const jwtIssuer =
    anonKeyFormat === "jwt" ? jwtIssuerFromAnonKey(anonKey) : null;
  const refsMatch =
    !!urlHost && !!keyProjectRef ? urlHost === keyProjectRef : false;

  const message = resolveSupabaseEnvMessage({
    hasUrl,
    hasAnonKey,
    isLocalhost,
    anonKeyFormat,
    jwtSegmentCount,
    anonKeyLength,
    jwtIssuer,
    urlHost,
    keyProjectRef,
    refsMatch,
  });

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
    jwtSegmentCount,
    anonKeyLength,
    jwtIssuer,
    message,
  };
}
