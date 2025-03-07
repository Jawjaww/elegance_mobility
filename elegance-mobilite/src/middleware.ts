import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Utiliser createServerClient pour l'authentification
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          req.cookies.set({
            name,
            value,
            ...options,
          })
          res.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          req.cookies.delete({
            name,
            ...options,
          })
          res.cookies.delete({
            name,
            ...options,
          })
        },
      },
    }
  )
  
  // Vérifier si le chemin demandé est une page admin (backoffice)
  const isAdminPath = req.nextUrl.pathname.startsWith('/admin')
  
  // Vérifier si c'est la page de login admin - on ne veut pas la protéger
  const isAdminLoginPage = req.nextUrl.pathname === '/admin/login'
  
  // Vérifier si le chemin demandé est une page front-end protégée
  const isProtectedPath = ['/reservation/success', '/my-account'].some(path => 
    req.nextUrl.pathname.startsWith(path)
  )
  
  // Vérifier l'authentification
  const { data: { session } } = await supabase.auth.getSession()
  
  // CAS 1: Pages du backoffice (admin) - sauf page de login admin
  if (isAdminPath && !isAdminLoginPage) {
    // Si pas de session, rediriger vers login admin
    if (!session) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    
    // Vérifier en plus que l'utilisateur a bien le rôle admin
    try {
      const { data: userRole } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();
      
      // Si l'utilisateur n'est pas admin, rediriger vers la page d'accueil
      if (!userRole || userRole.role !== 'admin') {
        return NextResponse.redirect(new URL('/', req.url))
      }
    } catch (error) {
      // En cas d'erreur, rediriger vers login admin par sécurité
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
  }
  
  // CAS 2: Pages protégées du front-end (à traiter séparément selon les cas)
  else if (isProtectedPath) {
    // Si pas de session et que c'est /reservation/success, permettre l'accès quand même
    if (!session && req.nextUrl.pathname === '/reservation/success') {
      // La page success gèrera elle-même l'authentification avec un modal
      return res
    }
    
    // Pour les autres pages protégées du front-end, rediriger vers la connexion utilisateur
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  return res
}

// Spécifier les chemins sur lesquels le middleware doit s'exécuter
export const config = {
  matcher: ['/admin/:path*', '/reservation/success', '/my-account/:path*']
}
