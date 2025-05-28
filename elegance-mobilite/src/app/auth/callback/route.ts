import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient, redirectToRoleHome } from '@/lib/database/server'
import { AppRole } from '@/lib/types/common.types'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')
    
    if (!code) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const supabase = await createServerSupabaseClient()
    const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !session?.user) {
      console.error('Erreur authentification:', error)
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    // Redirection avec le rôle et la redirection personnalisée si présente
    const userRole = session.user.role as AppRole
    const redirectTo = requestUrl.searchParams.get('redirectTo')
    await redirectToRoleHome(userRole, redirectTo)
    return

  } catch (error) {
    console.error('Erreur callback auth:', error)
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}