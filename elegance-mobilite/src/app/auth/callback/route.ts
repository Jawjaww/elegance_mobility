import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient, redirectToRoleHome } from '@/lib/database/server'
import { AppRole } from '@/lib/types/common.types'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    const from = requestUrl.searchParams.get('from')
    
    // Si pas de code, vérifier s'il y a déjà une session active
    if (!code) {
      const supabase = await createServerSupabaseClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        // Session active, rediriger selon le rôle
        const userRole = (session.user.app_metadata?.role || (session.user as any).raw_app_meta_data?.role) as AppRole
        console.log('Callback: Session active détectée, rôle:', userRole, 'from:', from)
        await redirectToRoleHome(userRole, from)
        return
      }
      
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !session?.user) {
      console.error('Erreur authentification:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Redirection avec le rôle et le contexte "from"
    const userRole = (session.user.app_metadata?.role || (session.user as any).raw_app_meta_data?.role) as AppRole
    console.log('Callback: Nouvelle session créée, rôle:', userRole, 'from:', from)
    await redirectToRoleHome(userRole, from)
    return

  } catch (error) {
    console.error('Erreur callback auth:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}