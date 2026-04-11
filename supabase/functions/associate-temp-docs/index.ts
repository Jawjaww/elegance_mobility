// Edge Function: associate-temp-docs
// Moves temporary uploaded files from tmp/{userId}/... to {driverId}/... and updates DB records
// Runs with service role key; caller must be the driver owner or an admin.
// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) console.warn('SUPABASE_URL or SERVICE_ROLE_KEY missing');

const admin = createClient(SUPABASE_URL ?? "", SERVICE_ROLE_KEY ?? "", { auth: { persistSession: false } });

serve(async (req) => {
  try {
    if (req.method !== 'POST') return new Response('method not allowed', { status: 405 });

    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ ok: false, error: 'missing authorization' }), { status: 401 });

    const token = authHeader.replace(/^Bearer\s+/i, '');
    const body = await req.json();
    const driverId = body?.driver_id;
    if (!driverId) return new Response(JSON.stringify({ ok: false, error: 'missing driver_id' }), { status: 400 });

    // get caller user info using the token
    const userRes = await fetch((SUPABASE_URL ?? '').replace(/\/$/, '') + '/auth/v1/user', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!userRes.ok) return new Response(JSON.stringify({ ok: false, error: 'invalid token' }), { status: 401 });
    const caller = await userRes.json();
    const callerId = caller?.id;
    if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'could not determine user from token' }), { status: 401 });

    // fetch driver to confirm ownership
    const { data: driverRow, error: driverErr } = await admin.from('drivers').select('id,user_id').eq('id', driverId).maybeSingle();
    if (driverErr) return new Response(JSON.stringify({ ok: false, error: driverErr.message }), { status: 500 });
    if (!driverRow) return new Response(JSON.stringify({ ok: false, error: 'driver not found' }), { status: 404 });

    // Check if caller is owner or admin
    let isAdmin = false;
    try {
      const adminUrl = (SUPABASE_URL ?? '').replace(/\/$/, '') + '/auth/v1/admin/users/' + callerId;
      const adminRes = await fetch(adminUrl, { headers: { 'Authorization': `Bearer ${SERVICE_ROLE_KEY}`, 'Content-Type': 'application/json' } });
      if (adminRes.ok) {
        const adminUser = await adminRes.json();
        const role = adminUser?.raw_app_meta_data?.role ?? adminUser?.app_metadata?.role ?? null;
        isAdmin = role === 'app_admin' || role === 'app_super_admin';
      }
    } catch (e) {
      console.warn('admin lookup failed', e);
    }

    if (!isAdmin && driverRow.user_id !== callerId) {
      return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403 });
    }

    const bucket = 'driver-documents';
    // list objects under tmp/{callerId}/
    const prefix = `tmp/${callerId}/`;
    const { data: listData, error: listErr } = await admin.storage.from(bucket).list(prefix, { limit: 1000, offset: 0, sortBy: { column: 'name', order: 'asc' } });
    if (listErr) return new Response(JSON.stringify({ ok: false, error: listErr.message }), { status: 500 });

    const results: any[] = [];
    for (const obj of listData || []) {
      // obj.name is the path relative to bucket
      const oldPath = obj.name || obj.path || obj.id;
      if (!oldPath) continue;
      const newPath = oldPath.replace(`tmp/${callerId}/`, `${driverId}/`);
      try {
        // copy then remove
        const { error: copyErr } = await admin.storage.from(bucket).copy(oldPath, newPath);
        if (copyErr) {
          results.push({ oldPath, newPath, ok: false, error: copyErr.message });
          continue;
        }
        const { error: rmErr } = await admin.storage.from(bucket).remove([oldPath]);
        if (rmErr) {
          results.push({ oldPath, newPath, ok: false, error: rmErr.message });
          continue;
        }

        // update DB record(s) referencing the temp path
        const { data: upd, error: updErr } = await admin
          .from('driver_documents')
          .update({ driver_id: driverId, file_url: newPath, validation_status: 'pending' })
          .eq('file_url', oldPath)
          .eq('validation_status', 'pending_temp')
          .select();

        if (updErr) {
          results.push({ oldPath, newPath, ok: false, error: updErr.message });
          continue;
        }

        results.push({ oldPath, newPath, ok: true, updated: upd?.length ?? 0 });
      } catch (e) {
        results.push({ oldPath, newPath, ok: false, error: String(e) });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 500 });
  }
});
