'use server'

import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/types/database.types'
import { User } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { SupabaseRole } from '@/lib/types/auth.types'

/**
 * Interface utilisateur Auth standardisée
 */
export interface AuthUser {
  id: string
  email?: string
  name?: string
  role: SupabaseRole
  user_metadata?: {
    name?: string
    phone?: string
    avatar_url?: string
    [key: string]: any
  }
}

/**
 * Crée un client Supabase côté serveur avec support des cookies.
 */
export const createServerSupabaseClient = async () => { // La fonction reste async car createServerClient peut l'être
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        // Utilise uniquement getAll et setAll sans rétrocompatibilité
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error: any) {
            if (!error.message?.includes('Cookies can only be modified')) {
              console.error('Failed to set cookies:', error)
            }
          }
        }
      }
    }
  )
}

/**
 * Récupère la session utilisateur depuis le serveur
 */
export async function getServerSession() {
  const supabase = await createServerSupabaseClient()
  return await supabase.auth.getSession()
}

/**
 * Convertit un User Supabase en AuthUser standardisé
 */
export async function mapSupabaseUserToAuthUser(user: User | null): Promise<AuthUser | null> {
  if (!user) return null

  return {
    id: user.id,
    email: user.email || undefined,
    name: user.user_metadata?.name,
    role: user.role as SupabaseRole,
    user_metadata: user.user_metadata
  }
}

/**
 * Récupère l'utilisateur authentifié depuis le serveur
 */
export async function getServerUser(): Promise<AuthUser | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return mapSupabaseUserToAuthUser(user)
}

/**
 * Redirige vers la page appropriée selon le rôle
 */
export async function redirectToRoleHome(role?: SupabaseRole) {
  switch (role) {
    case 'app_super_admin':
    case 'app_admin':
      redirect('/backoffice-portal')
    case 'app_driver':
      redirect('/driver-portal')
    case 'app_customer':
      redirect('/my-account')
    default:
      redirect('/login')
  }
}

/**
 * Hiérarchie des rôles pour les vérifications de permissions
 */
const roleHierarchy: Record<SupabaseRole, SupabaseRole[]> = {
  'app_super_admin': ['app_admin', 'app_driver', 'app_customer'],
  'app_admin': ['app_driver', 'app_customer'],
  'app_driver': ['app_customer'],
  'app_customer': [],
  'unauthorized': []
}

/**
 * Vérifie si l'utilisateur a accès à un rôle spécifique
 */
export async function hasPermission(userRole: SupabaseRole | null | undefined, requiredRole: SupabaseRole): Promise<boolean> {
  if (!userRole) return false
  if (userRole === requiredRole) return true
  return roleHierarchy[userRole]?.includes(requiredRole) || false
}

/**
 * Vérifie si l'utilisateur a accès à l'administration
 */
export async function hasAdminAccess(): Promise<boolean> {
  const user = await getServerUser()
  if (!user?.role) return false
  return user.role === 'app_admin' || user.role === 'app_super_admin'
}

/**
 * Vérifie si l'utilisateur est un super admin
 */
export async function isSuperAdmin(role?: SupabaseRole | null): Promise<boolean> {
  return role === 'app_super_admin'
}

/**
 * Vérifie l'authentification et redirige si nécessaire
 */
export async function requireAuth(requiredRole?: SupabaseRole, redirectTo: string = '/login'): Promise<AuthUser> {
  const user = await getServerUser()

  if (!user) {
    redirect(redirectTo)
  }

  if (requiredRole && (!user.role || !(await hasPermission(user.role, requiredRole)))) {
    redirect('/unauthorized')
  }

  return user
}
