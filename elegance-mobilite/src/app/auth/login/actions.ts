'use server'

import { createServerSupabaseClient } from '@/lib/database/server' 
import { type AuthError } from '@supabase/supabase-js'
import { isAdmin, isDriver } from '@/lib/database/roles'  // Import corrigé depuis database/roles
import { SupabaseRole } from '@/lib/types/auth.types'
import { redirect } from 'next/navigation'

/**
 * Login standard pour les utilisateurs (clients)
 */
export async function login(email: string, password: string): Promise<{
  error: AuthError | string | null
}> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error }
  }

  // Vérifier le rôle après la connexion
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Impossible de récupérer les informations utilisateur' }
  }

  // Le rôle est directement accessible via user.role (rôle PostgreSQL natif)
  const userRole = user.role as SupabaseRole;

  // L'administrateur ne devrait pas utiliser cette page de connexion
  if (isAdmin(userRole)) { 
    await supabase.auth.signOut()
    return { error: 'Veuillez utiliser la page de connexion administrateur' }
  }

  return { error: null }
}

/**
 * Action de déconnexion - à utiliser dans un composant form avec action={logout}
 */
export async function logout() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}

/**
 * Login spécifique pour les chauffeurs
 */
export async function driverLogin(email: string, password: string): Promise<{
  error: AuthError | string | null
}> {
  const supabase = await createServerSupabaseClient()
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error }
  }

  // Vérifier le rôle après la connexion
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Impossible de récupérer les informations utilisateur' }
  }

  // Le rôle est directement accessible via user.role (rôle PostgreSQL natif)
  const userRole = user.role as SupabaseRole;

  // Seuls les chauffeurs peuvent utiliser cette page de connexion
  if (!isDriver(userRole)) { 
    await supabase.auth.signOut()
    return { error: 'Accès non autorisé' }
  }

  return { error: null }
}

/**
 * Vérifie si l'utilisateur a accès à une ressource en fonction de son rôle
 */
export async function checkAccess(requiredRole: string | string[]) {
  const supabase = await createServerSupabaseClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  
  // Utiliser le rôle natif PostgreSQL dans session.user
  const userRole = session.user.role as SupabaseRole
  
  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(userRole)
  }
  
  return userRole === requiredRole
}
