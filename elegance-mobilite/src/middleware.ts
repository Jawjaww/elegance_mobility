import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()

  // Utiliser createServerClient au lieu de createMiddlewareClient
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
  
  // Pages qui nécessitent une authentification
  const protectedPaths = ['/reservation/success', '/my-account']
  
  // Vérifier si le chemin demandé est protégé
  const isProtectedPath = protectedPaths.some(path => 
    req.nextUrl.pathname.startsWith(path)
  )
  
  if (isProtectedPath) {
    // Vérifier l'authentification
    const { data: { session } } = await supabase.auth.getSession()
    
    // Si pas de session, rediriger vers la page de connexion
    if (!session) {
      const redirectUrl = new URL('/login', req.url)
      
      // Sauvegarder l'URL originale pour rediriger après connexion
      if (req.nextUrl.pathname.startsWith('/reservation/success')) {
        // Dans le cas spécial de la page de succès, rediriger vers la confirmation
        redirectUrl.searchParams.set('redirectTo', '/reservation/confirmation')
      } else {
        redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname)
      }
      
      return NextResponse.redirect(redirectUrl)
    }
  }
  
  return res
}

// Spécifier les chemins sur lesquels le middleware doit s'exécuter
export const config = {
  matcher: ['/reservation/success', '/my-account/:path*']
}
