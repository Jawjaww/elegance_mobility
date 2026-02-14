export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const BUCKET = 'driver-documents'

const SUPABASE_URL = process.env.SUPABASE_PUBLIC_URL || process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SERVICE_ROLE_KEY || ''

const base = SUPABASE_URL.replace(/\/+$/, '')

const admin = createClient(base, SERVICE_ROLE_KEY, { auth: { persistSession: false } })

export async function POST(request: Request) {
  try {
    if (!SERVICE_ROLE_KEY) return new Response(JSON.stringify({ ok: false, error: 'Service role key not configured' }), { status: 500 })

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')

    // validate token and get caller id
    if (!token) return new Response(JSON.stringify({ ok: false, error: 'Missing authorization token' }), { status: 401 })

    const userRes = await fetch(`${base}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}` } })
    if (!userRes.ok) return new Response(JSON.stringify({ ok: false, error: 'Invalid token' }), { status: 401 })
    const caller = await userRes.json()
    const callerId = caller?.id
    if (!callerId) return new Response(JSON.stringify({ ok: false, error: 'Could not determine user from token' }), { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as any
    const documentType = (formData.get('document_type') as string) || 'unknown'
    const driverId = (formData.get('driver_id') as string) || null

    if (!file) return new Response(JSON.stringify({ ok: false, error: 'Missing file' }), { status: 400 })

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const safeName = (file.name || 'file').replace(/\s+/g, '_')
    const path = driverId
      ? `${driverId}/${documentType}/${Date.now()}_${safeName}`
      : `tmp/${callerId}/${documentType}/${Date.now()}_${safeName}`

    const { data: uploadData, error: uploadError } = await admin.storage.from(BUCKET).upload(path, buffer, {
      upsert: true,
      contentType: file.type || undefined,
    })

    if (uploadError) {
      return new Response(JSON.stringify({ ok: false, error: uploadError.message || uploadError }), { status: 500 })
    }

    // create signed url
    const { data: signed, error: signedErr } = await admin.storage.from(BUCKET).createSignedUrl(uploadData.path, 60 * 60 * 24)

    // insert DB record - try pending_temp for anonymous uploads, fall back to 'pending' if DB constraint disallows
    const preferTemp = !driverId
    const tryInsert = async (status: string) => {
      const insertRow: any = {
        driver_id: driverId,
        document_type: documentType,
        file_url: uploadData.path,
        file_name: file.name || safeName,
        file_size: buffer.length,
        upload_date: new Date().toISOString(),
        validation_status: status,
      }
      return await admin.from('driver_documents').insert([insertRow]).select().maybeSingle()
    }

    let insertData = null
    let insertErr = null
    if (preferTemp) {
      ({ data: insertData, error: insertErr } = await tryInsert('pending_temp'))
      if (insertErr) {
        // Check constraint violations may indicate the remote DB doesn't support pending_temp
        const msg = insertErr.message || ''
        if (insertErr.code === '23514' || msg.includes('violates check constraint') || msg.includes('validation_status_check')) {
          // retry with 'pending'
          ({ data: insertData, error: insertErr } = await tryInsert('pending'))
        }
      }
    } else {
      ({ data: insertData, error: insertErr } = await tryInsert('pending'))
    }

    if (insertErr) {
      // Not fatal for the file, but report and return error
      return new Response(JSON.stringify({ ok: false, error: insertErr.message || insertErr, path: uploadData.path, signedUrl: signed?.signedUrl }), { status: 500 })
    }

    return new Response(JSON.stringify({ ok: true, insert: insertData, path: uploadData.path, signedUrl: signed?.signedUrl }), { status: 200 })
  } catch (err: any) {
    console.error('API /api/upload error', err)
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const op = url.searchParams.get('op');
    if (op !== 'signed') return new Response(JSON.stringify({ ok: false, error: 'unsupported operation' }), { status: 400 });

    const path = url.searchParams.get('path') || '';
    if (!path) return new Response(JSON.stringify({ ok: false, error: 'missing path' }), { status: 400 });

    // Require caller token to prevent open signed-url generation
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return new Response(JSON.stringify({ ok: false, error: 'missing authorization token' }), { status: 401 });

    const userRes = await fetch(`${base}/auth/v1/user`, { headers: { Authorization: `Bearer ${token}` } });
    if (!userRes.ok) return new Response(JSON.stringify({ ok: false, error: 'invalid token' }), { status: 401 });

    const { data: signed, error: signedErr } = await admin.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (signedErr) return new Response(JSON.stringify({ ok: false, error: signedErr.message || signedErr }), { status: 500 });

    return new Response(JSON.stringify({ ok: true, signedUrl: signed?.signedUrl }), { status: 200 });
  } catch (err: any) {
    console.error('API /api/upload GET error', err);
    return new Response(JSON.stringify({ ok: false, error: err.message || String(err) }), { status: 500 });
  }
}
