import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database, AuthUser } from '@/lib/types/database.types'
import type { CookieOptions } from '@supabase/ssr'

// Configuration du client Supabase pour Server Components et Actions
export async function createServerSupabaseClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      },
      cookies: {
        async getAll() {
          const cookieStore = await cookies()
          return cookieStore.getAll().map((cookie) => ({
            name: cookie.name,
            value: cookie.value,
            options: {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
              path: '/'
            }
          }))
        },
        async setAll(cookieList) {
          const cookieStore = await cookies()
          cookieList.forEach((cookie) => {
            cookieStore.set(cookie.name, cookie.value, cookie.options)
          })
        }
      }
    }
  )
}

// Fonction sécurisée pour obtenir l'utilisateur authentifié
export async function getServerUser(): Promise<AuthUser | null> {
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error) {
    console.error('Erreur d\'authentification:', error)
    return null
  }
  
  if (!user) return null

  // Transformer le User Supabase en AuthUser
  const authUser: AuthUser = {
    instance_id: null,
    id: user.id,
    aud: user.aud ?? null,
    role: user.role ?? null,
    email: user.email ?? null,
    encrypted_password: null,
    email_confirmed_at: user.email_confirmed_at ?? null,
    invited_at: null,
    confirmation_token: null,
    confirmation_sent_at: null,
    recovery_token: null,
    recovery_sent_at: null,
    email_change_token_new: null,
    email_change: null,
    email_change_sent_at: null,
    last_sign_in_at: user.last_sign_in_at ?? null,
    raw_app_meta_data: user.app_metadata ?? null,
    raw_user_meta_data: user.user_metadata ?? null,
    created_at: user.created_at ?? null,
    updated_at: user.updated_at ?? null,
    phone: user.phone ?? null,
    phone_confirmed_at: user.phone_confirmed_at ?? null,
    phone_change: null,
    phone_change_token: null,
    phone_change_sent_at: null,
    confirmed_at: user.confirmed_at ?? null,
    email_change_token_current: null,
    email_change_confirm_status: null,
    banned_until: null,
    reauthentication_token: null,
    reauthentication_sent_at: null,
    is_sso_user: false,
    deleted_at: null,
    is_anonymous: false
  }

  return authUser
}

// Fonction pour obtenir la session complète
export async function getServerSession() {
  const supabase = await createServerSupabaseClient()
  return await supabase.auth.getSession()
}

// Fonction pour échanger le code d'authentification contre une session
export async function exchangeAuthCode(code: string) {
  const supabase = await createServerSupabaseClient()
  return await supabase.auth.exchangeCodeForSession(code)
}

// Fonction pour gérer la redirection après authentification
export async function handleAuthRedirect(user: AuthUser) {
  const role = user.role

  switch (role) {
    case 'app_driver':
      return '/driver-portal'
    case 'app_admin':
    case 'app_super_admin':
      return '/backoffice-portal'
    case 'app_customer':
      return '/my-account'
    default:
      return '/'
  }
}
