import { supabase } from "@/lib/database/client";
import { isUserAdmin } from "@/lib/utils/auth-helpers";

function formatError(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (error && typeof error === "object") {
    const e = error as { message?: string; details?: string; hint?: string };
    if (e.message) return e.message;
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error);
}

/**
 * Refreshes the drivers table for admin views (no legacy RPC).
 */
export async function refreshDriversList() {
  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("Utilisateur non connecté");
    }

    if (!isUserAdmin(user)) {
      throw new Error("Accès refusé - rôle administrateur requis");
    }

    const { data, error } = await supabase
      .from("drivers")
      .select("id, first_name, last_name, user_id, status")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(formatError(error));
    }

    return {
      drivers: data ?? [],
      message: `${data?.length ?? 0} chauffeur(s) chargé(s)`,
    };
  } catch (error) {
    console.error(
      "[driver-sync] Failed to refresh drivers:",
      formatError(error),
    );
    throw error instanceof Error ? error : new Error(formatError(error));
  }
}

/** @deprecated Use refreshDriversList — kept for any residual imports */
export async function syncExistingDrivers() {
  return refreshDriversList();
}

/**
 * Vérifie les chauffeurs dans la table drivers
 */
export async function checkDriversTable() {
  try {
    const { data, error } = await supabase
      .from("drivers")
      .select("id, first_name, last_name, user_id, status")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(formatError(error));
    }

    return data;
  } catch (error) {
    console.error(
      "[driver-sync] Failed to check drivers table:",
      formatError(error),
    );
    throw error instanceof Error ? error : new Error(formatError(error));
  }
}
