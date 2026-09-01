export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import type { SupabaseClient } from '@supabase/supabase-js'
import {
  callerRole,
  getAdminSupabase,
  getServiceRoleKey,
  getSupabaseUrl,
  isAdminRole,
} from '@/lib/database/admin-client'
import { authenticateCaller } from '@/lib/database/admin-auth'
import { driverDocumentStorageCandidates } from '@/lib/storage/driverDocumentPath'

const BUCKET = 'driver-documents'
const SIGNED_URL_TTL_SEC = 60 * 60 * 24

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (typeof err === 'string') return err
  return 'Unknown error'
}

function jsonError(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
) {
  return new Response(JSON.stringify({ ok: false, error, ...extra }), { status })
}

function jsonOk(body: Record<string, unknown>) {
  return new Response(JSON.stringify({ ok: true, ...body }), { status: 200 })
}

function formString(form: FormData, key: string): string | null {
  const raw = form.get(key)
  if (typeof raw !== 'string' || raw.length === 0) return null
  return raw
}

function originalFileName(file: Blob): string {
  if ('name' in file && typeof (file as File).name === 'string') {
    return (file as File).name
  }
  return 'file'
}

function toSafeFileName(name: string): string {
  return name.split(' ').join('_')
}

function storageObjectPath(
  driverId: string | null,
  callerId: string,
  documentType: string,
  safeName: string,
) {
  const stamp = `${Date.now()}_${safeName}`
  if (driverId) return `${driverId}/${documentType}/${stamp}`
  return `tmp/${callerId}/${documentType}/${stamp}`
}

function isCheckConstraintError(err: { code?: string; message?: string }) {
  const msg = err.message ?? ''
  if (err.code === '23514') return true
  if (msg.includes('violates check constraint')) return true
  return msg.includes('validation_status_check')
}

async function adminContext(): Promise<
  | { error: Response }
  | { error?: undefined; serviceRoleKey: string; base: string; admin: SupabaseClient }
> {
  const serviceRoleKey = getServiceRoleKey()
  const base = getSupabaseUrl()
  const admin = getAdminSupabase()
  if (!serviceRoleKey || !base || !admin) {
    return { error: jsonError('Service role key not configured', 500) }
  }
  return { serviceRoleKey, base, admin }
}

async function assertDriverUploadAccess(
  admin: SupabaseClient,
  driverId: string | null,
  callerId: string,
  adminCaller: boolean,
) {
  if (!driverId || adminCaller) return null

  const { data: ownDriver } = await admin
    .from('drivers')
    .select('id')
    .eq('id', driverId)
    .eq('user_id', callerId)
    .maybeSingle()

  if (ownDriver) return null
  return jsonError('Not authorized for this driver', 403)
}

async function persistOwnedDocument(
  admin: SupabaseClient,
  params: {
    driverId: string
    documentType: string
    path: string
    originalName: string
    safeName: string
    fileSize: number
    signedUrl: string | undefined
  },
) {
  await admin.rpc('delete_driver_documents_of_type', {
    p_driver_id: params.driverId,
    p_document_type: params.documentType,
  })

  const { data: insertData, error: insertErr } = await admin
    .from('driver_documents')
    .insert([
      {
        driver_id: params.driverId,
        document_type: params.documentType,
        file_url: params.path,
        file_name: params.originalName || params.safeName,
        file_size: params.fileSize,
        upload_date: new Date().toISOString(),
        validation_status: 'pending' as const,
      },
    ])
    .select()
    .maybeSingle()

  if (insertErr) {
    return jsonError(insertErr.message, 500, {
      path: params.path,
      signedUrl: params.signedUrl,
    })
  }

  return jsonOk({
    insert: insertData,
    path: params.path,
    signedUrl: params.signedUrl,
  })
}

async function persistTempDocument(
  admin: SupabaseClient,
  params: {
    documentType: string
    path: string
    originalName: string
    safeName: string
    fileSize: number
    signedUrl: string | undefined
  },
) {
  const tempRow = {
    driver_id: null as string | null,
    document_type: params.documentType,
    file_url: params.path,
    file_name: params.originalName || params.safeName,
    file_size: params.fileSize,
    upload_date: new Date().toISOString(),
    validation_status: 'pending_temp',
  }

  let { data: insertData, error: insertErr } = await admin
    .from('driver_documents')
    .insert([tempRow])
    .select()
    .maybeSingle()

  if (insertErr && isCheckConstraintError(insertErr)) {
    ;({ data: insertData, error: insertErr } = await admin
      .from('driver_documents')
      .insert([{ ...tempRow, validation_status: 'pending' }])
      .select()
      .maybeSingle())
  }

  if (insertErr) {
    return jsonError(insertErr.message, 500, {
      path: params.path,
      signedUrl: params.signedUrl,
    })
  }

  return jsonOk({
    insert: insertData,
    path: params.path,
    signedUrl: params.signedUrl,
  })
}

export async function POST(request: Request) {
  try {
    const ctx = await adminContext()
    if (ctx.error) return ctx.error

    const auth = await authenticateCaller(request)
    if (auth.error) return auth.error

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof Blob)) return jsonError('Missing file', 400)

    const documentType = formString(formData, 'document_type') ?? 'unknown'
    const driverId = formString(formData, 'driver_id')
    const denied = await assertDriverUploadAccess(
      ctx.admin,
      driverId,
      auth.callerId,
      isAdminRole(callerRole(auth.caller)),
    )
    if (denied) return denied

    const originalName = originalFileName(file)
    const safeName = toSafeFileName(originalName)
    const path = storageObjectPath(
      driverId,
      auth.callerId,
      documentType,
      safeName,
    )
    const buffer = Buffer.from(await file.arrayBuffer())

    const { data: uploadData, error: uploadError } = await ctx.admin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        upsert: true,
        contentType: file.type || undefined,
      })

    if (uploadError || !uploadData?.path) {
      return jsonError(uploadError?.message || 'Upload failed', 500)
    }

    const { data: signed } = await ctx.admin.storage
      .from(BUCKET)
      .createSignedUrl(uploadData.path, SIGNED_URL_TTL_SEC)

    const persistParams = {
      documentType,
      path: uploadData.path,
      originalName,
      safeName,
      fileSize: buffer.length,
      signedUrl: signed?.signedUrl,
    }

    if (driverId) {
      return persistOwnedDocument(ctx.admin, { ...persistParams, driverId })
    }
    return persistTempDocument(ctx.admin, persistParams)
  } catch (err: unknown) {
    console.error('API /api/upload error', err)
    return jsonError(errorMessage(err), 500)
  }
}

export async function GET(request: Request) {
  try {
    const ctx = await adminContext()
    if (ctx.error) return ctx.error

    const url = new URL(request.url)
    if (url.searchParams.get('op') !== 'signed') {
      return jsonError('unsupported operation', 400)
    }

    const path = url.searchParams.get('path') || ''
    if (!path) return jsonError('missing path', 400)

    const auth = await authenticateCaller(request)
    if (auth.error) return auth.error
    if (!isAdminRole(callerRole(auth.caller))) {
      return jsonError('admin role required', 403)
    }

    const candidates = driverDocumentStorageCandidates(path)
    let signedUrl: string | undefined
    let lastError: string | undefined
    for (const candidate of candidates) {
      const { data: signed, error: signedErr } = await ctx.admin.storage
        .from(BUCKET)
        .createSignedUrl(candidate, 60 * 60)
      if (signed?.signedUrl) {
        signedUrl = signed.signedUrl
        break
      }
      lastError = signedErr?.message
    }
    if (!signedUrl) {
      return jsonError(lastError || 'signed url failed', 500)
    }

    return jsonOk({ signedUrl })
  } catch (err: unknown) {
    console.error('API /api/upload GET error', err)
    return jsonError(errorMessage(err), 500)
  }
}
