import type { User } from "@supabase/supabase-js";
import { getUserRole } from "@/lib/utils/auth-helpers";
import { canAccessClientPortal } from "@/lib/utils/roles";

/** Whether the authenticated user may use /my-account and client booking flows. */
export function canUserAccessClientPortal(
  user: User | null | undefined,
): boolean {
  if (!user) return false;
  return canAccessClientPortal(getUserRole(user));
}

export function clientPortalLoginUrl(returnPath: string): string {
  return `/auth/login?redirectTo=${encodeURIComponent(returnPath)}`;
}
