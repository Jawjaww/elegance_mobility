import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizeAnonKey } from "@/lib/utils/supabase-env-check";

function stripTrailingSlashes(value: string): string {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end -= 1;
  return value.slice(0, end);
}

/** Prefer local Next public URL so local docs are not resolved against remote cloud. */
export function getSupabaseUrl(): string {
  return stripTrailingSlashes(
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.SUPABASE_URL ||
      process.env.SUPABASE_PUBLIC_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ||
      "",
  );
}

function roleFromMetadata(value: unknown): string {
  if (value === null || typeof value !== "object" || !("role" in value)) {
    return "";
  }
  const role = (value as { role: unknown }).role;
  return typeof role === "string" ? role : "";
}

export function callerRole(caller: Record<string, unknown>): string {
  return (
    roleFromMetadata(caller.app_metadata) ||
    roleFromMetadata(caller.user_metadata)
  );
}

export function isAdminRole(role: string): boolean {
  return role === "app_admin" || role === "app_super_admin";
}

/** Strip a leading `Bearer ` prefix without a backtracking regex. */
export function stripBearerPrefix(authorizationHeader: string): string {
  const trimmed = authorizationHeader.trim();
  const prefix = "bearer ";
  if (
    trimmed.length >= prefix.length &&
    trimmed.slice(0, prefix.length).toLowerCase() === prefix
  ) {
    return trimmed.slice(prefix.length).trim();
  }
  return trimmed;
}

export function getServiceRoleKey(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    ""
  );
}

/** Anon / publishable key — use this as GoTrue apikey, not the service role. */
export function getAnonKey(): string {
  return normalizeAnonKey(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      "",
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
