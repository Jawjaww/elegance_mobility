import { createServerSupabaseClient } from '@/lib/database/server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import type { AppRole } from '@/lib/types/common.types'
/**
 * Récupère le rôle de l'utilisateur à partir du JWT (app_metadata.role)
 */
function extractRoleFromUser(user: any): string | undefined {
  // Cohérent avec getAppRole dans common.types.ts
  return (
    user?.app_metadata?.role ||
    user?.raw_app_meta_data?.role ||
    user?.user_metadata?.role ||
    user?.role
  );
}

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: AppRole[]
  redirectTo?: string
}

/**
 * Vérifie l'accès pour les rôles donnés
 */
export async function checkAccess(allowedRoles: AppRole[], redirectTo: string = '/auth/login'): Promise<void> {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`${redirectTo}?from=${encodeURIComponent(redirectTo)}`)
  }

  const userRole = extractRoleFromUser(user)
  if (!userRole || !allowedRoles.includes(userRole as AppRole)) {
    redirect('/unauthorized')
  }
}

/**
 * Composant de protection des routes par rôle
 */
export async function RoleGuard({ children, allowedRoles, redirectTo = '/auth/login' }: RoleGuardProps) {
  await checkAccess(allowedRoles, redirectTo)
  return <>{children}</>
}

/**
 * Guards spécifiques pour chaque type d'utilisateur
 */
export async function AdminGuard({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userRole = extractRoleFromUser(user)
  if (!user || !['app_admin', 'app_super_admin'].includes(userRole as AppRole)) {
    redirect('/auth/login?from=admin')
  }
  return <>{children}</>
}

export async function DriverGuard({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userRole = extractRoleFromUser(user)
  if (!user || userRole !== 'app_driver') {
    redirect('/auth/login?from=driver')
  }
  return <>{children}</>
}

export async function CustomerGuard({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userRole = extractRoleFromUser(user)
  if (!user || !['app_customer', 'app_admin', 'app_super_admin'].includes(userRole as AppRole)) {
    redirect('/auth/login')
  }
  return <>{children}</>
}