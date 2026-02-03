import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/database/server'

export async function POST(request: Request) {
  try {
    const { email, password, userData } = await request.json()
    
    console.log('🔗 Driver signup API called from /driver/signup')
    
    const supabase = await createServerSupabaseClient()
    
    // Faire l'inscription depuis cette route pour que le trigger détecte /driver/signup
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          ...userData,
          portal_type: 'driver',
        },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/verify-email?type=driver&next=/driver-portal/profile/setup`
      }
    })

    if (error) {
      console.error('Erreur signup:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    console.log('✅ Signup réussi:', data.user?.email)
    
    return NextResponse.json({ 
      success: true,
      user: data.user,
      message: 'Compte créé avec succès. Vérifiez votre email.'
    })

  } catch (error: any) {
    console.error('Erreur API signup:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
