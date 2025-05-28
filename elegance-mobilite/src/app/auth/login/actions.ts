'use server'

import { createServerSupabaseClient } from '@/lib/database/server'
import { type AuthError } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'

interface AuthResult {
  error: AuthError | string | null
  redirectTo?: string
}

// Routes publiques qui ne nécessitent pas d'authentification
const PUBLIC_ROUTES = [
  '/',
  '/reservation',
  '/auth/login',
  '/auth/signup',
  '/auth/signup/driver',
  '/auth/callback',
  '/api/auth/callback'
]

// Valider les rôles spécifiques
const isAdmin = (role: string | undefined | null): boolean => 
  role === 'app_admin' || role === 'app_super_admin'

const isDriver = (role: string | undefined | null): boolean => 
  role === 'app_driver'

/**
 * Login standard pour les utilisateurs
 */
export async function login(formData: FormData | { email: string; password: string }): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient()
  
  const email = formData instanceof FormData ? formData.get('email') as string : formData.email
  const password = formData instanceof FormData ? formData.get('password') as string : formData.password

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      return { error: 'Email ou mot de passe incorrect' }
    }
    return { error }
  }

  if (!data.user) {
    return { error: 'Impossible de récupérer les informations utilisateur' }
  }

  // Redirection basée sur le rôle natif PostgreSQL
  const userRole = data.user.role as string | undefined
  if (isAdmin(userRole)) {
    await supabase.auth.signOut()
    return { 
      error: 'Veuillez utiliser la page de connexion administrateur',
      redirectTo: '/backoffice-portal/login'
    }
  }

  // Récupérer l'URL de redirection si elle existe
  const searchParams = new URLSearchParams(window.location.search)
  const redirectTo = searchParams.get('redirectTo')

  // Si une redirection est spécifiée et que c'est une route publique, y aller directement
  if (redirectTo && PUBLIC_ROUTES.some(route => redirectTo.startsWith(route))) {
    return { error: null, redirectTo }
  }

  // Sinon, rediriger vers le portail approprié
  let defaultRedirect = '/my-account'
  if (isDriver(userRole)) {
    defaultRedirect = '/driver-portal'
  }

  return { error: null, redirectTo: redirectTo || defaultRedirect }
}

/**
 * Action d'inscription
 */
export async function register(formData: { 
  email: string
  password: string
  name: string 
}): Promise<AuthResult> {
  const supabase = await createServerSupabaseClient()
  
  const { data, error } = await supabase.auth.signUp({
    email: formData.email,
    password: formData.password,
    options: {
      data: { full_name: formData.name },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    }
  })

  if (error) {
    if (error.message.includes('User already registered')) {
      return { error: 'Cet email est déjà utilisé. Essayez de vous connecter.' }
    }
    return { error }
  }

  // Si pas de session, l'utilisateur doit confirmer son email
  if (data?.user && !data?.session) {
    return { 
      error: null,
      redirectTo: '/auth/verify-email'
    }
  }

  // Récupérer l'URL de redirection
  const searchParams = new URLSearchParams(window.location.search)
  const redirectTo = searchParams.get('redirectTo')

  // Si une redirection est spécifiée et que c'est une route publique
  if (redirectTo && PUBLIC_ROUTES.some(route => redirectTo.startsWith(route))) {
    return { error: null, redirectTo }
  }

  return { error: null, redirectTo: '/my-account' }
}

/**
 * Action de déconnexion
 */
export async function logout() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}
