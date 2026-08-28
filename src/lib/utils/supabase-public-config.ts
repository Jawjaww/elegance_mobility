import { normalizeAnonKey } from "@/lib/utils/supabase-env-check";

/** Client-side guard for misconfigured public Supabase env (common on first Vercel deploy). */
export function getSupabasePublicConfigError(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = normalizeAnonKey(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "");

  if (!url || !anonKey) {
    return "Configuration Supabase incomplète (URL ou clé anon manquante).";
  }

  if (/127\.0\.0\.1|localhost/.test(url)) {
    return "L'URL Supabase pointe vers localhost — utilisez l'URL cloud du projet sur Vercel.";
  }

  if (/service_role/i.test(anonKey)) {
    return "La clé anon Supabase est incorrecte (service role détectée).";
  }

  return null;
}

export function supabaseAuthErrorMessage(error: unknown): string {
  const status =
    error &&
    typeof error === "object" &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
      ? (error as { status: number }).status
      : undefined;

  if (status === 401) {
    const configError = getSupabasePublicConfigError();
    if (configError) return configError;
    return "Accès Supabase refusé (401). Vérifiez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sur Vercel.";
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return "Une erreur est survenue lors de la création du compte.";
}
