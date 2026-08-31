export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import {
  getAdminSupabase,
  getServiceRoleKey,
  getSupabaseUrl,
} from '@/lib/database/admin-client'

const BUCKET = 'driver-documents'

function isAdminCaller(caller: Record<string, unknown>): boolean {
  const meta = caller.app_metadata
  const userMeta = caller.user_metadata
  const roleFromApp =
    meta && typeof meta === 'object' && meta !== null && 'role' in meta
      ? String((meta as { role?: unknown }).role ?? '')
      : ''
  const roleFromUser =
    userMeta && typeof userMeta === 'object' && userMeta !== null && 'role' in userMeta
      ? String((userMeta as { role?: unknown }).role ?? '')
      : ''
  const role = roleFromApp || roleFromUser
  return role === 'app_admin' || role === 'app_super_admin'
}

function sanitizeStoragePath(raw: string): string | null {
  const path = decodeURIComponent(raw).replace(/^\/+/, '')
  if (!path || path.includes('..') || path.startsWith('/')) return null
  return path
}

async function requireAdmin(request: Request) {
  const SUPABASE_URL = getSupabaseUrl()
  const SERVICE_ROLE_KEY = getServiceRoleKey()
  if (!SERVICE_ROLE_KEY || !SUPABASE_URL) {
    return {
      error: new Response(
        JSON.stringify({ ok: false, error: 'Storage admin not configured' }),
        { status: 500 },
      ),
    }
  }

  const authHeader = request.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) {
    return {
      error: new Response(
        JSON.stringify({ ok: false, error: 'missing authorization token' }),
        { status: 401 },
      ),
    }
  }

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: SERVICE_ROLE_KEY },
  })
  if (!userRes.ok) {
    return {
      error: new Response(
        JSON.stringify({ ok: false, error: 'invalid token' }),
        { status: 401 },
      ),
    }
  }
  const caller = (await userRes.json()) as Record<string, unknown>
  if (!isAdminCaller(caller)) {
    return {
      error: new Response(
        JSON.stringify({ ok: false, error: 'admin role required' }),
        { status: 403 },
      ),
    }
  }
  return { caller }
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
    const path = sanitizeStoragePath(url.searchParams.get('path') || '')
    if (!path) {
      return new Response(JSON.stringify({ ok: false, error: 'missing path' }), {
        status: 400,
      })
    }

    const { data, error } = await admin.storage.from(BUCKET).download(path)
    if (error || !data) {
      return new Response(
        JSON.stringify({
          ok: false,
          error: error?.message || 'download failed',
          path,
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
        'Content-Disposition': `inline; filename="${path.split('/').pop() || 'document'}"`,
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('API /api/admin/driver-documents error', err)
    return new Response(JSON.stringify({ ok: false, error: message }), {
      status: 500,
    })
  }
}
