import { createServerSupabaseClient } from '@/lib/database/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Déconnexion de la session
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    // Redirection vers la page de login
    return NextResponse.json(
      { success: true },
      { 
        status: 200,
        headers: {
          'Location': '/auth/login'
        }
      }
    )

  } catch (error) {
    return NextResponse.json(
      { error: 'Une erreur est survenue lors de la déconnexion' },
      { status: 500 }
    )
  }
}