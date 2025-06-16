import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/database/server'

export async function GET(request: NextRequest) {
  try {
    const requestUrl = new URL(request.url)
    const token_hash = requestUrl.searchParams.get('token_hash')
    const type = requestUrl.searchParams.get('type')
    const next = requestUrl.searchParams.get('next')

    // Redirection par défaut selon le type
    let redirectTo = '/auth/login'
    
    if (type === 'email_confirmation') {
      redirectTo = next || '/driver-portal/profile/setup'
    }

    if (token_hash && type) {
      const supabase = await createServerSupabaseClient()

      const { data, error } = await supabase.auth.verifyOtp({
        type: type as any,
        token_hash,
      })

      if (!error && data.user) {
        console.log('✅ Email vérifié avec succès pour l\'utilisateur:', data.user.id)
        
        // Vérification réussie, rediriger avec un message de succès
        return NextResponse.redirect(new URL(`${redirectTo}?verified=true`, request.url))
      }
    }

    // En cas d'erreur ou de paramètres manquants, rediriger vers la page de connexion
    return NextResponse.redirect(new URL('/auth/login?error=verification_failed', request.url))

  } catch (error) {
    console.error('Erreur lors de la vérification email:', error)
    return NextResponse.redirect(new URL('/auth/login?error=verification_failed', request.url))
  }
}
