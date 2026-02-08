import { NextResponse, type NextRequest } from "next/server";

// Déconnexion côté serveur désactivée en mode client/Tauri. La déconnexion
// doit être effectuée côté client via le client Supabase. On renvoie 501.

export const dynamic = "error";

export async function POST(_req: NextRequest) {
  return NextResponse.json(
    { success: false, error: "server_auth_disabled" },
    { status: 501 },
  );
}
