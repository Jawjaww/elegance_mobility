import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import type { Database } from '@/lib/types/database.types'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Rediriger /login vers /auth/login
  if (pathname === '/login') {
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    const newUrl = new URL('/auth/login', request.url)
    if (redirectTo) {
      newUrl.searchParams.set('redirectTo', redirectTo)
    }
    return NextResponse.redirect(newUrl)
  }

  // Ignorer les routes publiques
  if (
    pathname === '/' ||
    pathname.startsWith('/auth/') ||
    pathname === '/reservation' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  try {
    const response = NextResponse.next()

    // Créer le client Supabase avec les nouvelles méthodes getAll/setAll
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll().map(cookie => ({
              name: cookie.name,
              value: cookie.value,
              options: {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
              }
            }))
          },
          setAll(cookies) {
            cookies.forEach(({ name, value, options }) => {
              response.cookies.set(name, value, options)
            })
          }
        }
      }
    )

    // Vérifier la session
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      const redirectUrl = new URL('/auth/login', request.url)
      redirectUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    const role = session.user.role as string

    // Protection des routes basée sur les rôles
    if (pathname.startsWith('/driver-portal')) {
      if (role !== 'app_driver') {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    if (pathname.startsWith('/my-account')) {
      if (role !== 'app_customer' && !['app_admin', 'app_super_admin'].includes(role)) {
        if (role === 'app_driver') {
          return NextResponse.redirect(new URL('/driver-portal', request.url))
        }
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    if (pathname.startsWith('/backoffice-portal')) {
      if (!['app_admin', 'app_super_admin'].includes(role)) {
        return NextResponse.redirect(new URL('/unauthorized', request.url))
      }
    }

    return response

  } catch (error) {
    console.error('Middleware error:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
