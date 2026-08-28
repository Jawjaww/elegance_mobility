import { supabase } from "@/lib/database/client";
import {
  exchangeAuthLinkCode,
  hasActiveSession,
  resolveOtpType,
  verifyAuthLinkToken,
  type AuthLinkResult,
} from "@/lib/auth/auth-link-verification";

export type AuthLinkCompletion = {
  completed: boolean;
  redirectTo?: string;
  error?: string;
};

const INVALID_LINK =
  "Le lien de connexion est invalide ou a expiré. Demandez un nouveau lien.";
const CODE_VERIFIER_HINT =
  "Ouvrez ce lien dans le même navigateur que celui utilisé pour la demande.";

function parseHashTokens(): {
  access_token: string;
  refresh_token: string;
  type: string | null;
} | null {
  if (typeof window === "undefined" || !window.location.hash.includes("access_token")) {
    return null;
  }
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const access_token = hash.get("access_token");
  const refresh_token = hash.get("refresh_token");
  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token, type: hash.get("type") };
}

export function resolvePostAuthRedirect(
  type: string | null,
  next: string | null,
): string {
  if (next?.startsWith("/")) return next;
  if (type === "recovery") return "/auth/update-password?type=recovery";
  if (type === "magiclink" || type === "signup" || type === "email_confirmation") {
    return "/my-account";
  }
  return "/my-account";
}

function shouldSkipAuthLinkHandler(pathname: string): boolean {
  return (
    pathname.startsWith("/auth/verify-email") ||
    pathname.startsWith("/auth/update-password")
  );
}

function stripAuthParamsFromUrl(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("token");
  url.searchParams.delete("token_hash");
  url.searchParams.delete("type");
  url.hash = "";
  window.history.replaceState({}, "", `${url.pathname}${url.search}`);
}

async function applySessionResult(
  result: AuthLinkResult,
  redirectTo: string,
): Promise<AuthLinkCompletion> {
  if (result.status === "session") {
    return { completed: true, redirectTo };
  }
  if (result.status === "error") {
    return { completed: false, error: result.message };
  }
  return { completed: false };
}

/** Completes Supabase email/magic links landing on any page (e.g. Site URL "/"). */
export async function completeAuthLinkFromUrl(): Promise<AuthLinkCompletion> {
  if (typeof window === "undefined") return { completed: false };

  const url = new URL(window.location.href);
  if (shouldSkipAuthLinkHandler(url.pathname)) {
    return { completed: false };
  }

  const code = url.searchParams.get("code");
  const token = url.searchParams.get("token_hash") ?? url.searchParams.get("token");
  const typeParam = url.searchParams.get("type");
  const next = url.searchParams.get("next");
  const otpType = resolveOtpType(typeParam);
  const redirectTo = resolvePostAuthRedirect(typeParam, next);

  const hashTokens = parseHashTokens();
  if (hashTokens) {
    const { error } = await supabase.auth.setSession({
      access_token: hashTokens.access_token,
      refresh_token: hashTokens.refresh_token,
    });
    if (error) return { completed: false, error: error.message };
    return {
      completed: true,
      redirectTo: resolvePostAuthRedirect(hashTokens.type ?? typeParam, next),
    };
  }

  if (token && otpType) {
    const result = await verifyAuthLinkToken(token, otpType, INVALID_LINK);
    const completion = await applySessionResult(result, redirectTo);
    if (completion.completed || completion.error) return completion;
  }

  if (code) {
    const result = await exchangeAuthLinkCode(
      code,
      INVALID_LINK,
      CODE_VERIFIER_HINT,
    );
    const completion = await applySessionResult(result, redirectTo);
    if (completion.completed || completion.error) return completion;
  }

  if (!code && !token && !hashTokens) {
    return { completed: false };
  }

  if (await hasActiveSession()) {
    return { completed: true, redirectTo };
  }

  return { completed: false, error: INVALID_LINK };
}

export async function runAuthLinkHandler(): Promise<void> {
  const url = new URL(window.location.href);
  const hasParams =
    url.searchParams.has("code") ||
    url.searchParams.has("token") ||
    url.searchParams.has("token_hash") ||
    url.hash.includes("access_token");

  if (!hasParams) return;

  const result = await completeAuthLinkFromUrl();
  if (result.error) {
    const target = `/auth/login?error=${encodeURIComponent(result.error)}`;
    window.location.replace(target);
    return;
  }

  if (result.completed && result.redirectTo) {
    stripAuthParamsFromUrl();
    window.location.replace(result.redirectTo);
  }
}
