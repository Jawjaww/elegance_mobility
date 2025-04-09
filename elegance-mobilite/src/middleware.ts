import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { SupabaseRole } from '@/lib/types/auth.types'

export const config = {
  matcher: [
    '/backoffice/:path*',  // Routes administratives
    '/driver-portal/:path*', // Routes conducteur
    '/my-account/:path*',  // Routes utilisateur connecté
    '/auth/admin-login',   // Page de login admin
    '/(api|trpc)/((?!public).*)' // Protection des API privées
  ]
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  try {
    // Création du client Supabase avec la gestion standard des cookies
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name) {
            return request.cookies.get(name)?.value
          },
          set(name, value, options) {
            // Définir les options de cookie standard pour la sécurité
            response.cookies.set({
              name,
              value,
              ...options,
              httpOnly: true,
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          },
          remove(name, options) {
            response.cookies.delete({
              name,
              ...options
            })
          }
        }
      }
    )

    // Vérification de l'authentification avec getUser() qui est plus sécurisée que getSession()
    // car elle authentifie les données en contactant le serveur Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser()
    
    // Obtenir le chemin actuel
    const url = new URL(request.url)
    const path = url.pathname
    
    // Exclure les pages de connexion de la vérification d'auth
    if (
      path === '/auth/admin-login' || 
      path === '/driver-portal/login' || 
      path === '/login'
    ) {
      return response
    }
    
    // Si pas d'utilisateur authentifié, rediriger vers la page de connexion appropriée
    if (!user || error) {
      if (path.startsWith('/backoffice')) {
        return NextResponse.redirect(new URL('/auth/admin-login', request.url))
      } else if (path.startsWith('/driver-portal')) {
        return NextResponse.redirect(new URL('/driver-portal/login', request.url))
      } else if (path.startsWith('/my-account')) {
        return NextResponse.redirect(new URL('/login', request.url))
      } else if (path.match(/^\/(api|trpc)/)) {
        // Retourner une erreur 401 pour les API non-publiques
        return new NextResponse(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return response
    }

    // Obtenir le rôle de l'utilisateur depuis la session
    const userRole = user.role as SupabaseRole

    // Protection des routes par rôle natif Supabase
    if (path.startsWith('/backoffice')) {
      if (userRole !== 'app_admin' && userRole !== 'app_super_admin') {
        return NextResponse.redirect(
          new URL('/auth/admin-login', request.url)
        )
      }
    }

    if (path.startsWith('/driver-portal')) {
      if (userRole !== 'app_driver') {
        return NextResponse.redirect(
          new URL('/', request.url)
        )
      }
    }

    if (path.startsWith('/my-account')) {
      if (!userRole || userRole === 'unauthorized') {
        return NextResponse.redirect(
          new URL('/login', request.url)
        )
      }
    }

    // Protection des API privées avec les rôles natifs
    if (path.match(/^\/(api|trpc)/)) {
      if (path.includes('/admin/') && 
          userRole !== 'app_admin' && 
          userRole !== 'app_super_admin') {
        return new NextResponse(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }

      if (path.includes('/driver/') && userRole !== 'app_driver') {
        return new NextResponse(
          JSON.stringify({ error: 'Access denied' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // Ajouter l'en-tête user-role pour utilisation côté client si nécessaire
    if (userRole) {
      response.headers.set('x-user-role', userRole.toString())
    }

    return response

  } catch (e) {
    console.error('Erreur middleware auth:', e)
    
    // En cas d'erreur dans le middleware, on redirige vers la page d'accueil
    // plutôt que de bloquer toute l'application
    const url = new URL(request.url)
    if (url.pathname.match(/^\/(api|trpc)/)) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }
    
    return NextResponse.redirect(new URL('/', request.url))
  }
}
