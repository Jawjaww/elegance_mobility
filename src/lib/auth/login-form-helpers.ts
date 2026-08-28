import { getUserRole as getAppRole } from "@/lib/utils/auth-helpers";
import type { AppRole } from "@/lib/utils/roles";

type LoginJson = {
  error?: string;
  detail?: unknown;
  session?: { access_token?: string; refresh_token?: string };
  user?: unknown;
};

export async function postLoginRequest(
  email: string,
  password: string,
): Promise<
  | { ok: true; json: LoginJson }
  | { ok: false; networkError: true }
  | { ok: false; networkError: false; status: number; json: LoginJson }
> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    let json: LoginJson = {};
    try {
      json = (await response.json()) as LoginJson;
    } catch {
      json = {};
    }

    if (!response.ok) {
      return { ok: false, networkError: false, status: response.status, json };
    }

    return { ok: true, json };
  } catch {
    return { ok: false, networkError: true };
  }
}

export function dispatchLoginSession(session: LoginJson["session"]): void {
  if (!session?.access_token || !session.refresh_token) return;
  try {
    window.dispatchEvent(
      new CustomEvent("elegance:setSession", { detail: session }),
    );
  } catch {
    /* ignore dispatch errors */
  }
}

export function adminPortalRequiredError(
  userRole: AppRole,
  from: string | null,
): string | null {
  const isAdmin = userRole === "app_admin" || userRole === "app_super_admin";
  if (isAdmin && from !== "admin") {
    return "Veuillez utiliser la page de connexion administrateur.";
  }
  return null;
}

export function resolveLoginRedirectPath(input: {
  redirectTo: string | null;
  from: string | null;
  userRole: AppRole;
}): { path: string } | { error: string } {
  const { redirectTo, from, userRole } = input;

  if (redirectTo) return { path: redirectTo };
  if (!from) return { path: "/my-account" };

  if (from === "driver" && userRole !== "app_driver") {
    return { error: "Accès non autorisé pour ce portail." };
  }

  const isAdminPortal = from === "admin";
  const isAdminRole = userRole === "app_admin" || userRole === "app_super_admin";
  if (isAdminPortal && !isAdminRole) {
    return { error: "Accès non autorisé pour ce portail." };
  }

  if (from === "driver") return { path: "/driver-portal/dashboard" };
  if (from === "admin") return { path: "/backoffice-portal" };
  return { path: "/my-account" };
}

export function getLoginUserRole(user: unknown): AppRole {
  return getAppRole(user as Parameters<typeof getAppRole>[0]) as AppRole;
}
