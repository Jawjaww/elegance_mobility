import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient, getServerUser, exchangeAuthCode } from '@/lib/database/server'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (!code) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Échanger le code contre une session
    const { data: { session }, error } = await exchangeAuthCode(code)

    if (error || !session?.user) {
      console.error('Erreur d\'authentification:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Récupérer l'utilisateur authentifié avec le bon type
    const authUser = await getServerUser()
    if (!authUser) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Déterminer la redirection en fonction du rôle
    const redirectPath = authUser.role === 'app_driver' 
      ? '/driver-portal'
      : authUser.role === 'app_admin' || authUser.role === 'app_super_admin'
      ? '/backoffice-portal'
      : '/my-account'

    // Vérifier s'il y a une redirection spécifique
    const redirectTo = requestUrl.searchParams.get('redirectTo')
    if (redirectTo && !redirectTo.includes('/driver-portal')) {
      return NextResponse.redirect(new URL(redirectTo, request.url))
    }

    // Rediriger vers le bon portail
    return NextResponse.redirect(new URL(redirectPath, request.url))

  } catch (error) {
    console.error('Erreur callback auth:', error)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}