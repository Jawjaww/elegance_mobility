// @ts-nocheck — fichier legacy, non utilisé dans le build moderne
import { NextResponse, type NextRequest } from "next/server";
// Route déplacée dans _unused_api_routes — neutralisée pour le build client/Tauri.
// Anciennement elle utilisait createServerSupabaseClient.
import { getUserRole, isUserAdmin } from "@/lib/utils/auth-helpers";
import { ROLES } from "@/lib/utils/roles";
import { cookies } from "next/headers";

export const dynamic = "error"; // Exclude from static export (incompatible with Tauri)

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url);
    const token = requestUrl.searchParams.get("token");
    const code = requestUrl.searchParams.get("code");
    const type = requestUrl.searchParams.get("type");
    const next = requestUrl.searchParams.get("next") || "/client-portal";

    // Validate and normalize the "next" parameter to prevent open redirects
    let redirectTo = next.startsWith("/") ? next : "/my-account";

    const supabase = await createServerSupabaseClient();

    if (type === "recovery" && token) {
      console.log("🔍 Tentative de vérification via verifyOtp...");
      const { data, error } = await supabase.auth.verifyOtp({
        type: "recovery",
        token_hash: token,
      });

      if (data?.session) {
        console.log("✅ Session créée via verifyOtp");
        // Source: app_metadata uniquement (serveur)
        const userRole = getUserRole(data.user);
        redirectTo = isUserAdmin(data.user) ? "/backoffice-portal" : redirectTo;

        (await cookies()).set("sb:token", data.session.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
        });
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }

    if (code) {
      console.log("🔍 Tentative d'échange via exchangeCodeForSession...");
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);

      if (data?.session) {
        console.log("✅ Session créée via exchangeCodeForSession");
        // Source: app_metadata uniquement (serveur)
        const userRole = getUserRole(data.user);
        redirectTo = isUserAdmin(data.user) ? "/backoffice-portal" : redirectTo;

        (await cookies()).set("sb:token", data.session.access_token, {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
        });
        return NextResponse.redirect(new URL(redirectTo, request.url));
      }
    }

    console.error("❌ Échec de la vérification ou de l'échange de code/token");
    return NextResponse.redirect(
      new URL("/auth/update-password?error=verification_failed", request.url),
    );
  } catch (error) {
    console.error("Erreur lors de la vérification email:", error);
    return NextResponse.redirect(
      new URL("/auth/login?error=verification_failed", request.url),
    );
  }
}
