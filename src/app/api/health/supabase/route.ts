import { NextResponse } from "next/server";
import { inspectSupabasePublicEnv } from "@/lib/utils/supabase-env-check";

/** Runtime Supabase env diagnostic (no secret values returned). */
export async function GET() {
  const report = inspectSupabasePublicEnv(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return NextResponse.json(report, { status: report.ok ? 200 : 503 });
}
