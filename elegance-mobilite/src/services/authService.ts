import { supabase, signOut as supabaseSignOut } from "@/lib/database/client";

/**
 * Client-side auth helpers for Tauri/static export.
 */
export async function logout() {
  try {
    // Prefer the shared signOut helper in database client
    const result = await supabaseSignOut();
    return result;
  } catch (error) {
    console.error("logout error:", error);
    return { success: false, error: (error as any)?.message || String(error) };
  }
}

export default { logout };
