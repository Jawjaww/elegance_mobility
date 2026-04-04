/**
 * Server-side auth helpers
 * Pour usage dans les Server Components, Server Actions, et API routes
 */

import { createServerClient as createSupabaseServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { AppRole } from '@/lib/types/common.types'
import { getEffectiveRole, ROLES } from './roles'

/**
 * Crée un client Supabase pour le serveur
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from Server Component
          }
        },
      },
    }
  )
}

/**
 * Récupère l'utilisateur et son rôle côté serveur
 * Utilise getUser() pour valider le JWT
 */
export async function getServerUserAndRole() {
  const supabase = await createServerSupabaseClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { user: null, role: null as AppRole | null }
  }

  const role = getEffectiveRole(user.app_metadata?.role as AppRole | undefined)

  return { user, role }
}

/**
 * Récupère uniquement l'utilisateur côté serveur
 */
export async function getServerUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return user
}
