export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import {
  getAdminSupabase,
  getServiceRoleKey,
  getSupabaseUrl,
} from '@/lib/database/admin-client'

const BUCKET = 'driver-documents'

function callerRole(caller: Record<string, unknown>): string {
  const appMeta = caller.app_metadata
  const userMeta = caller.user_metadata
  if (appMeta && typeof appMeta === 'object' && appMeta !== null && 'role' in appMeta) {
    return String((appMeta as { role?: unknown }).role ?? '')
  }
  if (userMeta && typeof userMeta === 'object' && userMeta !== null && 'role' in userMeta) {
    return String((userMeta as { role?: unknown }).role ?? '')
  }
  return ''
}

function isAdminRole(role: string): boolean {
  return role === 'app_admin' || role === 'app_super_admin'
}

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

export async function POST(request: Request) {
  try {
    const SERVICE_ROLE_KEY = getServiceRoleKey()
    const base = getSupabaseUrl()
    const admin = getAdminSupabase()
    if (!SERVICE_ROLE_KEY || !base || !admin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Service role key not configured' }),
        { status: 500 },
      )
    }

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Missing authorization token' }),
        { status: 401 },
      )
    }

    const userRes = await fetch(`${base}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_ROLE_KEY },
    })
    if (!userRes.ok) {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid token' }), {
        status: 401,
      })
    }
    const caller = (await userRes.json()) as Record<string, unknown>
    const callerId = typeof caller.id === 'string' ? caller.id : null
    if (!callerId) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Could not determine user from token' }),
        { status: 401 },
      )
    }

    const role = callerRole(caller)
    const adminCaller = isAdminRole(role)

    const formData = await request.formData()
    const file = formData.get('file')
    const documentType = String(formData.get('document_type') || 'unknown')
    const driverIdRaw = formData.get('driver_id')
    const driverId =
      typeof driverIdRaw === 'string' && driverIdRaw.length > 0
        ? driverIdRaw
        : null

    if (!(file instanceof Blob)) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing file' }), {
        status: 400,
      })
    }

    // Admin may upload for any driver; non-admin only for own driver row or tmp
    if (driverId && !adminCaller) {
      const { data: ownDriver } = await admin
        .from('drivers')
        .select('id')
        .eq('id', driverId)
        .eq('user_id', callerId)
        .maybeSingle()
      if (!ownDriver) {
        return new Response(
          JSON.stringify({ ok: false, error: 'Not authorized for this driver' }),
          { status: 403 },
        )
      }
    }

    if (!driverId && !adminCaller) {
      // tmp path for pre-driver flows stays allowed for authenticated users
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const originalName =
      'name' in file && typeof (file as File).name === 'string'
        ? (file as File).name
        : 'file'
    const safeName = originalName.replaceAll(/\s+/g, '_')
    const path = driverId
      ? `${driverId}/${documentType}/${Date.now()}_${safeName}`
      : `tmp/${callerId}/${documentType}/${Date.now()}_${safeName}`

    const { data: uploadData, error: uploadError } = await admin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || undefined,
      })

    if (uploadError || !uploadData?.path) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: uploadError?.message || 'Upload failed',
        }),
        { status: 500 },
      )
    }

    const { data: signed } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(uploadData.path, 60 * 60 * 24)

    // With a real driver_id: replace previous docs of same type (1 active per type)
    if (driverId) {
      await admin.rpc('delete_driver_documents_of_type', {
        p_driver_id: driverId,
        p_document_type: documentType,
      })

      const insertRow = {
        driver_id: driverId,
        document_type: documentType,
        file_url: uploadData.path,
        file_name: originalName || safeName,
        file_size: buffer.length,
        upload_date: new Date().toISOString(),
        validation_status: 'pending' as const,
      }

      const { data: insertData, error: insertErr } = await admin
        .from('driver_documents')
        .insert([insertRow])
        .select()
        .maybeSingle()

      if (insertErr) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: insertErr.message,
            path: uploadData.path,
            signedUrl: signed?.signedUrl,
          }),
          { status: 500 },
        )
      }

      return new Response(
        JSON.stringify({
          ok: true,
          insert: insertData,
          path: uploadData.path,
          signedUrl: signed?.signedUrl,
        }),
        { status: 200 },
      )
    }

    // Temporary upload (no driver yet)
    const tempRow = {
      driver_id: null as string | null,
      document_type: documentType,
      file_url: uploadData.path,
      file_name: originalName || safeName,
      file_size: buffer.length,
      upload_date: new Date().toISOString(),
      validation_status: 'pending_temp',
    }

    let { data: insertData, error: insertErr } = await admin
      .from('driver_documents')
      .insert([tempRow])
      .select()
      .maybeSingle()

    if (insertErr) {
      const msg = insertErr.message || ''
      if (
        insertErr.code === '23514' ||
        msg.includes('violates check constraint') ||
        msg.includes('validation_status_check')
      ) {
        ;({ data: insertData, error: insertErr } = await admin
          .from('driver_documents')
          .insert([{ ...tempRow, validation_status: 'pending' }])
          .select()
          .maybeSingle())
      }
    }

    if (insertErr) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: insertErr.message,
          path: uploadData.path,
          signedUrl: signed?.signedUrl,
        }),
        { status: 500 },
      )
    }

    return new Response(
      JSON.stringify({
        ok: true,
        insert: insertData,
        path: uploadData.path,
        signedUrl: signed?.signedUrl,
      }),
      { status: 200 },
    )
  } catch (err: unknown) {
    console.error('API /api/upload error', err)
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage(err) }),
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const SERVICE_ROLE_KEY = getServiceRoleKey()
    const base = getSupabaseUrl()
    const admin = getAdminSupabase()
    if (!SERVICE_ROLE_KEY || !base || !admin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Service role key not configured' }),
        { status: 500 },
      )
    }

    const url = new URL(request.url)
    const op = url.searchParams.get('op')
    if (op !== 'signed') {
      return new Response(
        JSON.stringify({ ok: false, error: 'unsupported operation' }),
        { status: 400 },
      )
    }

    const path = url.searchParams.get('path') || ''
    if (!path) {
      return new Response(
        JSON.stringify({ ok: false, error: 'missing path' }),
        { status: 400 },
      )
    }

    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace(/^Bearer\s+/i, '')
    if (!token) {
      return new Response(
        JSON.stringify({ ok: false, error: 'missing authorization token' }),
        { status: 401 },
      )
    }

    const userRes = await fetch(`${base}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_ROLE_KEY },
    })
    if (!userRes.ok) {
      return new Response(
        JSON.stringify({ ok: false, error: 'invalid token' }),
        { status: 401 },
      )
    }
    const caller = (await userRes.json()) as Record<string, unknown>
    if (!isAdminRole(callerRole(caller))) {
      return new Response(
        JSON.stringify({ ok: false, error: 'admin role required' }),
        { status: 403 },
      )
    }

    const { data: signed, error: signedErr } = await admin.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60)
    if (signedErr) {
      return new Response(
        JSON.stringify({ ok: false, error: signedErr.message || signedErr }),
        { status: 500 },
      )
    }

    return new Response(
      JSON.stringify({ ok: true, signedUrl: signed?.signedUrl }),
      { status: 200 },
    )
  } catch (err: unknown) {
    console.error('API /api/upload GET error', err)
    return new Response(
      JSON.stringify({ ok: false, error: errorMessage(err) }),
      { status: 500 },
    )
  }
}
