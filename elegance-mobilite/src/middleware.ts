import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log('🔍 MIDDLEWARE TRIGGERED:', request.nextUrl.pathname)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          // Écrire uniquement dans la response : modifier `request.cookies` n'est
          // pas garanti utile dans l'environnement Next.js / Edge.
          response.cookies.set(name, value, options as any)
        })
      },
    },
  })

  let user = null
  let authError = null
  
  try {
    const result = await supabase.auth.getUser()
    user = result.data?.user || null
    authError = result.error
  } catch (e: any) {
    authError = e
    console.log('❌ Auth exception:', e.message)
  }

  console.log('👤 User:', user?.id || 'NULL')
  console.log('❌ AuthError:', authError?.message || 'NONE')
  console.log('🔑 Cookies:', request.cookies.getAll().map(c => c.name))

  const { pathname } = request.nextUrl

  const publicPaths = [
    '/',
    '/auth/login',
    '/auth/signup',
    '/auth/signup/driver',
    '/reservation',
    '/contact',
    '/backoffice-portal/login',
    '/driver-portal/login',
    '/my-account/login',
  ]

  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(path)
  )

  if (authError || !user) {
    if (!isPublicPath) {
      console.log('🚫 REDIRECT (no user, protected path)')
      const url = request.nextUrl.clone()
      
      if (pathname.startsWith('/backoffice-portal')) {
        url.pathname = '/backoffice-portal/login'
      } else if (pathname.startsWith('/driver-portal')) {
        url.pathname = '/driver-portal/login'
      } else if (pathname.startsWith('/my-account')) {
        url.pathname = '/my-account/login'
      } else {
        url.pathname = '/auth/login'
      }
      
      return NextResponse.redirect(url)
    }
    return response
  }

  const role = user.app_metadata?.role

  if (pathname.startsWith('/backoffice-portal')) {
    if (role !== 'app_admin' && role !== 'app_super_admin') {
      console.log('🚫 REDIRECT (wrong role for backoffice)')
      const url = request.nextUrl.clone()
      url.pathname = '/backoffice-portal/login'
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith('/driver-portal')) {
    if (role !== 'app_driver') {
      console.log('🚫 REDIRECT (wrong role for driver)')
      const url = request.nextUrl.clone()
      url.pathname = '/driver-portal/login'
      return NextResponse.redirect(url)
    }
  }

  if (pathname.startsWith('/my-account')) {
    if (role !== 'app_customer') {
      console.log('🚫 REDIRECT (wrong role for customer)')
      const url = request.nextUrl.clone()
      url.pathname = '/my-account/login'
      return NextResponse.redirect(url)
    }
  }

  console.log('✅ Access granted')
  return response
}

export const config = {
  matcher: ['/backoffice-portal/:path*', '/driver-portal/:path*', '/my-account/:path*'],
}
