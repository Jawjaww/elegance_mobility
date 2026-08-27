import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/database/client";

/** Prefer local session read — avoids noisy 401 from /auth/v1/user on public auth pages. */
export async function getOptionalAuthUser(): Promise<User | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.user ?? null;
}
