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

const SIGNED_URL_TTL_SEC = 60 * 60

/**
 * Sign several private driver-documents paths in one round trip.
 *
 * The client requests this instead of one GET per document: signing here keeps the service role
 * (a private bucket stays readable) while the browser fetches the image directly, so the Next
 * server stops streaming every document body twice.
 */
export async function POST(request: Request) {
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

    const body = (await request.json().catch(() => null)) as {
      paths?: unknown
    } | null
    const requested = Array.isArray(body?.paths)
      ? body.paths.filter((p): p is string => typeof p === 'string')
      : []
    if (requested.length === 0) {
      return new Response(JSON.stringify({ ok: false, error: 'missing paths' }), {
        status: 400,
      })
    }

    const urls: Record<string, string> = {}
    await Promise.all(
      requested.map(async (raw) => {
        const clean = sanitizeStoragePath(raw)
        if (!clean) return
        // A stored path can predate a rename; sign the first candidate the bucket accepts.
        for (const candidate of driverDocumentStorageCandidates(clean)) {
          const { data } = await admin.storage
            .from(DRIVER_DOCS_BUCKET)
            .createSignedUrl(candidate, SIGNED_URL_TTL_SEC)
          if (data?.signedUrl) {
            urls[raw] = data.signedUrl
            return
          }
        }
      }),
    )

    return new Response(JSON.stringify({ ok: true, urls }), { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('API /api/admin/driver-documents POST error', err)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
    })
  }
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
