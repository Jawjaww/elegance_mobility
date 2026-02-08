// Route déplacée dans _unused_api_routes — neutralisée pour le build client/Tauri.
// Anciennement elle utilisait createServerSupabaseClient.
// @ts-nocheck — fichier legacy, non utilisé dans le build moderne
import { NextResponse } from "next/server";

export const dynamic = "error"; // Exclude from static export (incompatible with Tauri)

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();

    // Déconnexion de la session
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Redirection vers la page de login
    return NextResponse.json(
      { success: true },
      {
        status: 200,
        headers: {
          Location: "/auth/login",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Une erreur est survenue lors de la déconnexion" },
      { status: 500 },
    );
  }
}
