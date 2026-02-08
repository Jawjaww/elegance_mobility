import { NextResponse, type NextRequest } from "next/server";

// Ce route handler est neutralisé en mode client/Tauri. Les échanges de code/token
// doivent maintenant être réalisés côté client (PKCE). Pour éviter les erreurs
// TypeScript liées à l'import de `server.ts`, on redirige simplement vers la page
// de login qui gèrera la suite du flux client-side.

export const dynamic = "error";

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/login", request.url));
}
