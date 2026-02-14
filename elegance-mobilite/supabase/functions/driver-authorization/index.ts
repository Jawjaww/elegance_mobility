// Edge Function: driver-authorization
// Uses absolute imports so the Supabase CLI / Deno bundler can resolve them.
// Minimal implementation: reads auth.users.raw_app_meta_data and calls can_driver_accept_rides RPC.
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.warn('SUPABASE_URL or SERVICE_ROLE_KEY not found in env');
}

const supabase = createClient(SUPABASE_URL ?? "", SERVICE_ROLE_KEY ?? "", { auth: { persistSession: false } });

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("user_id");
    if (!userId) return new Response(JSON.stringify({ ok: false, error: "missing user_id" }), { status: 400 });

    // read role from the Supabase Admin REST API to avoid schema/search_path issues
    const adminUrl = (SUPABASE_URL ?? "").replace(/\/$/, "") + "/auth/v1/admin/users/" + userId;
    const adminRes = await fetch(adminUrl, { headers: { "Authorization": `Bearer ${SERVICE_ROLE_KEY}`, "Content-Type": "application/json" } });
    if (!adminRes.ok) {
      const txt = await adminRes.text();
      return new Response(JSON.stringify({ ok: false, error: `admin user fetch failed: ${adminRes.status} ${txt}` }), { status: 500 });
    }
    const adminUser = await adminRes.json();
    const role = adminUser?.raw_app_meta_data?.role ?? adminUser?.app_metadata?.role ?? null;

    const { data: rpc, error: e2 } = await supabase.rpc("can_driver_accept_rides", { driver_user_id: userId }).single();
    if (e2) {
      return new Response(JSON.stringify({ ok: false, error: e2.message }), { status: 500 });
    }

    return new Response(JSON.stringify({
      ok: true,
      role,
      can_accept: rpc?.can_accept ?? false,
      reason: rpc?.reason ?? null
    }), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
