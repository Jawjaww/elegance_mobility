'use server'

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { type User, AppRole, getAppRole } from '@/lib/types/common.types'
import type { Database } from '@/lib/types/database.types'

/**
 * Crée un client Supabase côté serveur avec support des cookies.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false, // Désactiver l'auto-refresh pour éviter les modifications de cookies
        persistSession: true,
        storageKey: 'elegance-auth'
      },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          // Ne pas essayer de modifier les cookies dans les composants serveur
          // Les cookies seront gérés côté client ou via les route handlers
        }
      }
    }
  )
}

/**
 * Récupère l'utilisateur connecté côté serveur avec son rôle.
 */
export async function getServerUser(): Promise<User | null> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      // Erreur d'auth silencieuse - pas besoin de log (session invalide/non connecté = cas normal)
      return null
    }
    
    if (!user) {
      return null
    }

    // Récupérer le rôle via getAppRole (source de vérité unique)
    const role = getAppRole(user as any)
    
    return {
      ...user,
      role: role as AppRole
    } as User

  } catch (error) {
    // Erreur silencieuse - pas besoin de polluer les logs
    return null
  }
}

/**
 * Redirige vers la page appropriée selon le rôle et le contexte
 */
export async function redirectToRoleHome(role?: AppRole | null, from?: string | null) {
  const appRole = getAppRole({ role } as any)
  
  // Si on vient d'un contexte spécifique, vérifier l'autorisation
  if (from) {
    if (from === 'driver' && appRole === 'app_driver') {
      redirect('/driver-portal/dashboard')
    }
    if (from === 'admin' && ['app_admin', 'app_super_admin'].includes(appRole || '')) {
      redirect('/backoffice-portal')
    }
    // Si le rôle ne correspond pas au contexte, rediriger vers la page appropriée pour le rôle
  }

  // Redirection par défaut basée sur le rôle
  switch (appRole) {
    case 'app_super_admin':
    case 'app_admin':
      redirect('/backoffice-portal')
    case 'app_driver':
      redirect('/driver-portal/dashboard')
    case 'app_customer':
      redirect('/my-account')
    default:
      redirect('/auth/login')
  }
}
