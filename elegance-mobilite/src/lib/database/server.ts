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
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
        storageKey: 'elegance-auth'
      },
      cookies: {
        async getAll() {
          const cookieStore = cookies()
          return (await cookieStore).getAll().map(cookie => ({
            name: cookie.name,
            value: cookie.value,
            options: {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            }
          }))
        },
        async setAll(cookieList) {
          const cookieStore = cookies()
          cookieList.forEach(async ({ name, value, options }) => {
            (await cookieStore).set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/'
            })
          })
        }
      }
    }
  )
}

/**
 * Récupère l'utilisateur authentifié depuis le serveur
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = await createServerSupabaseClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Erreur d\'authentification:', authError)
      return null
    }

    // Utiliser la fonction RPC get_effective_role pour obtenir le rôle
    const { data: roleData } = await supabase.rpc('get_effective_role')
    
    return {
      ...user,
      role: roleData as AppRole
    } as User

  } catch (error) {
    console.error('Erreur critique lors de la récupération de l\'utilisateur:', error)
    return null
  }
}

/**
 * Redirige vers la page appropriée selon le rôle et le contexte
 */
export async function redirectToRoleHome(role?: AppRole | null, redirectTo?: string | null) {
  const appRole = getAppRole({ role } as any)
  // Valider la redirection personnalisée si elle existe
  if (redirectTo) {
    const isValidRedirect = (
      (appRole === 'app_driver' && redirectTo.startsWith('/driver-portal')) ||
      (['app_admin', 'app_super_admin'].includes(appRole || '') && redirectTo.startsWith('/backoffice-portal')) ||
      (appRole === 'app_customer' && redirectTo.startsWith('/my-account'))
    )

    if (isValidRedirect) {
      redirect(redirectTo)
    }
  }

  // Redirection par défaut basée sur le rôle
  switch (appRole) {
    case 'app_super_admin':
    case 'app_admin':
    case 'app_driver':
    case 'app_customer':
    default:
      redirect('/auth/login')
  }
}
