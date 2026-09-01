import { createClient } from "@supabase/supabase-js";
import {
  createServerClient,
  type CookieOptions,
} from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  callerRole,
  getAnonKey,
  getSupabaseUrl,
  isAdminRole,
  stripBearerPrefix,
} from "@/lib/database/admin-client";
import { ELEGANCE_AUTH_STORAGE_KEY } from "@/lib/database/auth-storage";

export type AuthCallerUser = {
  id: string;
  app_metadata?: Record<string, unknown>;
  user_metadata?: Record<string, unknown>;
};

export type AuthCallerLookup = {
  user: AuthCallerUser | null;
  error?: string;
};

export type AuthCallerLookups = {
  getUserByJwt?: (jwt: string) => Promise<AuthCallerLookup>;
  getUserFromCookies?: () => Promise<AuthCallerLookup>;
};

export function jsonAuthError(error: string, status: number): Response {
  return new Response(JSON.stringify({ ok: false, error }), { status });
}

export function callerRecordFromUser(
  user: AuthCallerUser,
): Record<string, unknown> {
  return {
    id: user.id,
    app_metadata: user.app_metadata ?? {},
    user_metadata: user.user_metadata ?? {},
  };
}

async function defaultGetUserByJwt(jwt: string): Promise<AuthCallerLookup> {
  const url = getSupabaseUrl();
  const anonKey = getAnonKey();
  if (!url || !anonKey) {
    return { user: null, error: "not configured" };
  }

  const client = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await client.auth.getUser(jwt);
  if (error || !data.user?.id) {
    const status =
      error && typeof error === "object" && "status" in error
        ? (error as { status?: number }).status
        : undefined;
    console.warn(
      "[admin-auth] JWT getUser failed",
      status ?? "",
      error?.message ?? "invalid token",
    );
    return { user: null, error: error?.message ?? "invalid token" };
  }

  return {
    user: {
      id: data.user.id,
      app_metadata: data.user.app_metadata as Record<string, unknown> | undefined,
      user_metadata: data.user.user_metadata as Record<string, unknown> | undefined,
    },
  };
}

async function defaultGetUserFromCookies(): Promise<AuthCallerLookup> {
  const url = getSupabaseUrl();
  const anonKey = getAnonKey();
  if (!url || !anonKey) {
    return { user: null, error: "not configured" };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anonKey, {
    cookieOptions: { name: ELEGANCE_AUTH_STORAGE_KEY },
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Route handlers may not allow setting cookies in some contexts.
        }
      },
    },
  });

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    console.warn(
      "[admin-auth] cookie getUser failed",
      error?.message ?? "no session",
    );
    return { user: null, error: error?.message ?? "no session" };
  }

  return {
    user: {
      id: data.user.id,
      app_metadata: data.user.app_metadata as Record<string, unknown> | undefined,
      user_metadata: data.user.user_metadata as Record<string, unknown> | undefined,
    },
  };
}

export async function authenticateCaller(
  request: Request,
  lookups?: AuthCallerLookups,
): Promise<
  | { error: Response; caller?: undefined; callerId?: undefined }
  | { error?: undefined; caller: Record<string, unknown>; callerId: string }
> {
  const jwt = stripBearerPrefix(request.headers.get("authorization") || "");
  const getUserByJwt = lookups?.getUserByJwt ?? defaultGetUserByJwt;
  const getUserFromCookies =
    lookups?.getUserFromCookies ?? defaultGetUserFromCookies;

  if (jwt) {
    const lookup = await getUserByJwt(jwt);
    if (lookup.error === "not configured") {
      return { error: jsonAuthError("Storage admin not configured", 500) };
    }
    if (!lookup.user) {
      return { error: jsonAuthError("invalid token", 401) };
    }
    return {
      caller: callerRecordFromUser(lookup.user),
      callerId: lookup.user.id,
    };
  }

  const cookieLookup = await getUserFromCookies();
  if (cookieLookup.error === "not configured") {
    return { error: jsonAuthError("Storage admin not configured", 500) };
  }
  if (!cookieLookup.user) {
    return { error: jsonAuthError("missing authorization token", 401) };
  }
  return {
    caller: callerRecordFromUser(cookieLookup.user),
    callerId: cookieLookup.user.id,
  };
}

export async function requireAdmin(
  request: Request,
  lookups?: AuthCallerLookups,
): Promise<
  | { error: Response; caller?: undefined; callerId?: undefined }
  | { error?: undefined; caller: Record<string, unknown>; callerId: string }
> {
  const auth = await authenticateCaller(request, lookups);
  if (auth.error) return auth;
  if (!isAdminRole(callerRole(auth.caller))) {
    return { error: jsonAuthError("admin role required", 403) };
  }
  return auth;
}
