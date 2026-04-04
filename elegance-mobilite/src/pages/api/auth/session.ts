import type { NextApiRequest, NextApiResponse } from 'next'

// Endpoint minimal pour enregistrer les tokens de session en cookies HttpOnly
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { access_token, refresh_token, expires_in } = req.body || {}

    console.log('[api/auth/session] POST body keys:', Object.keys(req.body || {}))

    if (!access_token || !refresh_token) {
      console.warn('[api/auth/session] Missing tokens in request body')
      return res.status(400).json({ error: 'Missing tokens' })
    }

    const isProd = process.env.NODE_ENV === 'production'

    const accessMaxAge = typeof expires_in === 'number' ? Math.max(60, expires_in) : 60 * 60 // fallback 1h
    const refreshMaxAge = 60 * 60 * 24 * 30 // 30 days

    const safe = (v: string) => encodeURIComponent(String(v))

    const cookieOptions = (name: string, value: string, maxAge: number) => {
      // Note: in dev we don't set Secure to allow localhost non-HTTPS testing
      return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}; ${isProd ? 'Secure; ' : ''}`
    }

    // Set cookies (encoded values)
    res.setHeader('Set-Cookie', [
      cookieOptions('sb-access-token', safe(access_token), accessMaxAge),
      cookieOptions('sb-refresh-token', safe(refresh_token), refreshMaxAge),
    ])

    // Helpful headers for debugging
    res.setHeader('Access-Control-Allow-Credentials', 'true')

    console.log('[api/auth/session] Set sb-access-token and sb-refresh-token cookies')

    return res.status(200).json({ success: true })
  } catch (err: any) {
    console.error('Error in /api/auth/session', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
