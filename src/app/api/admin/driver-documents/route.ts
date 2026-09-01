export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { getAdminSupabase } from '@/lib/database/admin-client'
import { requireAdmin } from '@/lib/database/admin-auth'
import {
  DRIVER_DOCS_BUCKET,
  driverDocumentStorageCandidates,
  normalizeDriverDocumentPath,
} from '@/lib/storage/driverDocumentPath'

function sanitizeStoragePath(raw: string): string | null {
  let path: string
  try {
    path = decodeURIComponent(raw)
  } catch {
    return null
  }
  return normalizeDriverDocumentPath(path) ? path : null
}

/** Stream a private driver-documents object for authenticated admins. */
export async function GET(request: Request) {
  try {
    const auth = await requireAdmin(request)
    if (auth.error) return auth.error

    const admin = getAdminSupabase()
    if (!admin) {
      return new Response(
        JSON.stringify({ ok: false, error: 'Storage admin not configured' }),
        { status: 500 },
      )
    }

    const url = new URL(request.url)
    const rawPath = sanitizeStoragePath(url.searchParams.get('path') || '')
    if (!rawPath) {
      return new Response(JSON.stringify({ ok: false, error: 'missing path' }), {
        status: 400,
      })
    }

    const candidates = driverDocumentStorageCandidates(rawPath)
    let data: Blob | null = null
    let lastError: string | undefined
    let resolvedPath = candidates[0] ?? rawPath

    for (const candidate of candidates) {
      const result = await admin.storage.from(DRIVER_DOCS_BUCKET).download(candidate)
      if (result.data) {
        data = result.data
        resolvedPath = candidate
        break
      }
      lastError = result.error?.message
    }

    if (!data) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: lastError || 'download failed',
          path: resolvedPath,
        }),
        { status: 404 },
      )
    }

    const contentType = data.type || 'application/octet-stream'
    return new Response(data.stream(), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=300',
        'Content-Disposition': `inline; filename="${resolvedPath.split('/').pop() || 'document'}"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('API /api/admin/driver-documents error', err)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
    })
  }
}
