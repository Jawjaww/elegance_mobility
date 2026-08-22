export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createClient } from '@supabase/supabase-js'

const BUCKET = 'driver-documents'

/** Prefer local Next public URL so local docs are not resolved against remote SUPABASE_PUBLIC_URL. */
const SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.SUPABASE_PUBLIC_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL ||
  ''
).replace(/\/+$/, '')

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.SERVICE_ROLE_KEY ||
  ''

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
})

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
