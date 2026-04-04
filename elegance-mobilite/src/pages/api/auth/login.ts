import type { NextApiRequest, NextApiResponse } from 'next'

// Proxy server-side pour login : échange email/password → tokens Supabase
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { email, password } = req.body || {}
    if (!email || !password) {
      return res.status(400).json({ error: 'Missing credentials' })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceKey) {
      console.warn('[api/auth/login] Missing SUPABASE config')
      return res.status(500).json({ error: 'Supabase not configured' })
    }

    const tokenUrl = `${supabaseUrl.replace(/\/$/, '')}/auth/v1/token?grant_type=password`

    const body = new URLSearchParams()
    body.append('email', email)
    body.append('password', password)

    const resp = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
      body: body.toString(),
    })

    const data = await resp.json().catch(() => ({}))

    if (!resp.ok) {
      console.warn('[api/auth/login] token endpoint error', resp.status, data)
      return res.status(401).json({ error: data?.error || 'Authentication failed', detail: data })
    }

    const access_token = data.access_token
    const refresh_token = data.refresh_token
    const expires_in = data.expires_in

    if (!access_token || !refresh_token) {
      console.warn('[api/auth/login] token response missing tokens', data)
      return res.status(500).json({ error: 'Invalid token response', detail: data })
    }

    const isProd = process.env.NODE_ENV === 'production'
    const accessMaxAge = typeof expires_in === 'number' ? Math.max(60, expires_in) : 60 * 60
    const refreshMaxAge = 60 * 60 * 24 * 30

    const safe = (v: string) => encodeURIComponent(String(v))
    const cookieOptions = (name: string, value: string, maxAge: number) => {
      return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${isProd ? 'Secure; ' : ''}`
    }

    res.setHeader('Set-Cookie', [
      cookieOptions('sb-access-token', safe(access_token), accessMaxAge),
      cookieOptions('sb-refresh-token', safe(refresh_token), refreshMaxAge),
    ])

    // Try to return user object if present in response
    const user = data.user || null

    return res.status(200).json({ success: true, user })
  } catch (err: any) {
    console.error('[api/auth/login] error', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
