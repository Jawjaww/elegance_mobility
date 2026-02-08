import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "error"; // Exclude from static export (incompatible with Tauri)

export async function GET(request: NextRequest) {
  return NextResponse.redirect(new URL("/auth/login", request.url));
}
