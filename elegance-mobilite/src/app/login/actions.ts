'use server'

import { createServerSupabaseClient } from '@/lib/database/server' 
import { type AuthError } from '@supabase/supabase-js'
import { isAdmin, isDriver } from '@/lib/utils/roles'
import { SupabaseRole } from '@/lib/types/auth.types' // Importer depuis auth.types

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

  // Caster user.role en SupabaseRole
  const userRole = user.role as SupabaseRole | undefined;

  // L'administrateur ne devrait pas utiliser cette page de connexion
  if (isAdmin(userRole)) { 
    await supabase.auth.signOut()
    return { error: 'Veuillez utiliser la page de connexion administrateur' }
  }

  return { error: null }
}

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

  // Caster user.role en SupabaseRole
  const userRole = user.role as SupabaseRole | undefined;

  // Seuls les chauffeurs peuvent utiliser cette page de connexion
  if (!isDriver(userRole)) { 
    await supabase.auth.signOut()
    return { error: 'Accès non autorisé' }
  }

  return { error: null }
}

export async function logout() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
}
