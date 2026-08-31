import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Prefer local Next public URL so local docs are not resolved against remote cloud. */
export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.SUPABASE_PUBLIC_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ||
    ""
  ).replace(/\/+$/, "");
}

export function getServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    ""
  );
}

/**
 * Lazy admin client. Do not construct at module load: `next build` collects
 * route data without secrets and createClient('', '') throws "supabaseKey is required".
 */
export function getAdminSupabase(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}
