// @ts-nocheck — fichier legacy, non utilisé dans le build moderne
import { NextResponse, type NextRequest } from "next/server";
// Route déplacée dans _unused_api_routes — neutralisée pour le build client/Tauri.
// Anciennement elle utilisait createServerSupabaseClient/redirectToRoleHome.
import { getUserRole } from "@/lib/utils/auth-helpers";
import { AppRole } from "@/lib/types/common.types";

export const dynamic = "error"; // Exclude from static export (incompatible with Tauri)

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get("code");
    const from = requestUrl.searchParams.get("from");
    const next = requestUrl.searchParams.get("next");

    console.log("Callback params:", { code: !!code, from, next });

    // Si pas de code, vérifier s'il y a déjà une session active
    if (!code) {
      const supabase = await createServerSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        console.log("Session active trouvée");
        // Si un paramètre next est spécifié, rediriger vers cette URL
        if (next) {
          console.log("Redirection vers next:", next);
          return NextResponse.redirect(new URL(next, request.url));
        }

        // Session active, rediriger selon le rôle (source: app_metadata uniquement)
        const userRole = getUserRole(session.user) as AppRole;
        console.log(
          "Callback: Session active détectée, rôle:",
          userRole,
          "from:",
          from,
        );
        await redirectToRoleHome(userRole, from);
        return;
      }

      console.log("Pas de code et pas de session, redirection vers login");
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }

    // Gestion du code d'autorisation standard
    const supabase = await createServerSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !session?.user) {
      console.error("Erreur authentification:", error);
      return NextResponse.redirect(
        new URL("/auth/login?error=auth_failed", request.url),
      );
    }

    console.log("Session créée avec succès");

    // Si un paramètre next est spécifié, rediriger vers cette URL (ex: configuration profil chauffeur)
    if (next) {
      console.log("Redirection vers next après auth:", next);
      return NextResponse.redirect(new URL(next, request.url));
    }

    // Redirection avec le rôle et le contexte "from" (source: app_metadata uniquement)
    const userRole = getUserRole(session.user) as AppRole;
    console.log(
      "Callback: Nouvelle session créée, rôle:",
      userRole,
      "from:",
      from,
    );
    await redirectToRoleHome(userRole, from);
    return;
  } catch (error) {
    console.error("Erreur callback auth:", error);
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
}
