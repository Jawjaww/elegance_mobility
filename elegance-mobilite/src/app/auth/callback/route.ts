import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient, redirectToRoleHome } from '@/lib/database/server'
import { AppRole } from '@/lib/types/common.types'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const from = requestUrl.searchParams.get('from')
    const next = requestUrl.searchParams.get('next')
    
    console.log('Callback params:', { code: !!code, from, next })
    
    // Si pas de code, vérifier s'il y a déjà une session active
    if (!code) {
      const supabase = await createServerSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        console.log('Session active trouvée')
        // Si un paramètre next est spécifié, rediriger vers cette URL
        if (next) {
          console.log('Redirection vers next:', next)
          return NextResponse.redirect(new URL(next, request.url))
        }
        
        // Session active, rediriger selon le rôle
        const userRole = (session.user.app_metadata?.role || (session.user as any).raw_app_meta_data?.role) as AppRole
        console.log('Callback: Session active détectée, rôle:', userRole, 'from:', from)
        await redirectToRoleHome(userRole, from)
        return
      }
      
      console.log('Pas de code et pas de session, redirection vers login')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Gestion du code d'autorisation standard
    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !session?.user) {
      console.error('Erreur authentification:', error)
      return NextResponse.redirect(new URL('/auth/login?error=auth_failed', request.url))
    }

    console.log('Session créée avec succès')
    
    // Si un paramètre next est spécifié, rediriger vers cette URL (ex: configuration profil chauffeur)
    if (next) {
      console.log('Redirection vers next après auth:', next)
      return NextResponse.redirect(new URL(next, request.url))
    }

    // Redirection avec le rôle et le contexte "from"
    const newUserRole = (session.user.app_metadata?.role || (session.user as any).raw_app_meta_data?.role) as AppRole
    console.log('Callback: Nouvelle session créée, rôle:', newUserRole, 'from:', from)
    await redirectToRoleHome(newUserRole, from)
    return

    if (error || !session?.user) {
      console.error('Erreur authentification:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Si un paramètre next est spécifié, rediriger vers cette URL (ex: configuration profil chauffeur)
    if (next) {
      return NextResponse.redirect(new URL(next as string, request.url))
    }

    // Redirection avec le rôle et le contexte "from"
    const userRole = (session!.user.app_metadata?.role || (session!.user as any).raw_app_meta_data?.role) as AppRole
    console.log('Callback: Nouvelle session créée, rôle:', userRole, 'from:', from)
    await redirectToRoleHome(userRole, from)
    return

  } catch (error) {
    console.error('Erreur callback auth:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}