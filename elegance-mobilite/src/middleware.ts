import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/auth/callback',
  '/auth/forgot-password',
  '/auth/update-password',
  '/auth/verify-email',
  '/auth/already-connected',
  '/backoffice-portal/login',
  '/driver-portal/login',
  '/reservation',
  '/contact',
  '/tarifs',
  '/services',
  '/api',
  '/_next',
  '/favicon.ico',
]

// Routes protégées par rôle
const ADMIN_ROUTES = ['/backoffice-portal']
const DRIVER_ROUTES = ['/driver-portal']
const CLIENT_ROUTES = ['/my-account']

// Vérifie si une route est publique
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route)) ||
    pathname.includes('.') ||
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/')
}

// Vérifie si un cookie de session existe (vérification rapide sans appel API)
function hasSessionCookie(request: NextRequest): boolean {
  const cookies = request.cookies.getAll()
  // Cherche un cookie qui contient le token Supabase
  return cookies.some(cookie => 
    cookie.name.includes('elegance-auth') || 
    cookie.name.includes('supabase') ||
    cookie.name.startsWith('sb-')
  )
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Route publique = laisser passer immédiatement
  if (isPublicRoute(pathname)) {
    return NextResponse.next()
  }

  // Vérification rapide : cookie de session présent ?
  if (!hasSessionCookie(request)) {
    // Pas de cookie = pas connecté = rediriger
    let loginUrl = '/auth/login'
    
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      loginUrl = '/backoffice-portal/login'
    } else if (DRIVER_ROUTES.some(route => pathname.startsWith(route))) {
      loginUrl = '/auth/login?from=driver'
    } else if (CLIENT_ROUTES.some(route => pathname.startsWith(route))) {
      loginUrl = '/auth/login?redirectTo=' + encodeURIComponent(pathname)
    }

    return NextResponse.redirect(new URL(loginUrl, request.url))
  }

  // Cookie présent = laisser passer, la vérification réelle se fait côté client
  // C'est plus rapide sur Safari qui a des problèmes avec les cookies partitionnés
  return NextResponse.next()
}

// Configurer sur quelles routes le middleware s'exécute
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
