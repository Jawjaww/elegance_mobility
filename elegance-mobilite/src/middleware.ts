import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { hasAdminAccess } from './lib/types/auth.types'

export async function middleware(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const response = NextResponse.next()

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Get session and check auth
    const { data: { session } } = await supabase.auth.getSession()

    // Debug logging
    if (process.env.NODE_ENV === 'development') {
      console.log('[MIDDLEWARE] Auth check:', {
        path: requestUrl.pathname,
        hasSession: !!session,
        role: session?.user?.role,
      })
    }

    // Handle auth routes (login pages)
    if (requestUrl.pathname.startsWith('/auth/')) {
      if (session) {
        // Already authenticated users should be redirected
        return NextResponse.redirect(new URL('/backoffice', request.url))
      }
      return response
    }

    // Handle protected routes
    if (requestUrl.pathname.startsWith('/backoffice')) {
      if (!session) {
        // Redirect to login if not authenticated
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('redirectTo', requestUrl.pathname)
        return NextResponse.redirect(redirectUrl)
      }

      // Check admin access using native role
      if (!hasAdminAccess(session.user.role)) {
        const redirectUrl = new URL('/auth/login', request.url)
        redirectUrl.searchParams.set('error', 'insufficient_permissions')
        return NextResponse.redirect(redirectUrl)
      }
    }

    return response
  } catch (error) {
    console.error('[MIDDLEWARE] Critical error:', error)
    
    // On error in protected routes, redirect to login
    if (requestUrl.pathname.startsWith('/backoffice')) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('error', 'internal')
      return NextResponse.redirect(redirectUrl)
    }
    
    return response
  }
}

// Protect specific routes
export const config = {
  matcher: [
    '/auth/:path*',
    '/backoffice/:path*',
    '/account/:path*',
  ],
}
