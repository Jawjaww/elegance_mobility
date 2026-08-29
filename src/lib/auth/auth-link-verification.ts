import { supabase } from "@/lib/database/client";

type AuthOtpType =
  | "signup"
  | "email"
  | "recovery"
  | "magiclink"
  | "invite";

export type AuthLinkResult =
  | { status: "session" }
  | { status: "error"; message: string }
  | { status: "pending" };

export async function verifyAuthLinkToken(
  token: string,
  type: AuthOtpType,
  invalidMessage: string,
): Promise<AuthLinkResult> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type,
    });
    if (error) return { status: "error", message: invalidMessage };
    if (data.session) return { status: "session" };
    return { status: "pending" };
  } catch {
    return { status: "error", message: "Impossible de valider le lien." };
  }
}

export async function exchangeAuthLinkCode(
  code: string,
  invalidMessage: string,
  codeVerifierMessage: string,
): Promise<AuthLinkResult> {
  try {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // detectSessionInUrl may already have consumed the one-time code.
      if (await hasActiveSession()) return { status: "session" };

      const msg = error.message ?? "";
      const isCodeVerifier =
        msg.includes("code verifier") || msg.includes("code_verifier");
      return {
        status: "error",
        message: isCodeVerifier ? codeVerifierMessage : invalidMessage,
      };
    }
    if (data.session) return { status: "session" };
    return { status: "pending" };
  } catch {
    if (await hasActiveSession()) return { status: "session" };
    return { status: "error", message: "Impossible de valider le lien." };
  }
}

export async function hasActiveSession(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return !!session;
}

/** Wait briefly for detectSessionInUrl / onAuthStateChange to settle. */
export async function waitForActiveSession(
  attempts = 6,
  delayMs = 150,
): Promise<boolean> {
  for (let i = 0; i < attempts; i += 1) {
    if (await hasActiveSession()) return true;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

export function watchAuthSession(onSession: () => void, includeRecovery = false): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    const recoveryReady = includeRecovery && event === "PASSWORD_RECOVERY";
    const signedIn = (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session;
    if (recoveryReady || signedIn) onSession();
  });
  return () => subscription.unsubscribe();
}

export function resolveOtpType(
  rawType: string | null,
): AuthOtpType | null {
  if (!rawType) return null;
  if (rawType === "email_confirmation" || rawType === "signup") return "signup";
  if (rawType === "recovery") return "recovery";
  if (rawType === "magiclink") return "magiclink";
  if (rawType === "invite") return "invite";
  if (rawType === "email") return "email";
  return null;
}
