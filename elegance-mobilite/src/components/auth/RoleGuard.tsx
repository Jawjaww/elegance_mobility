import { createServerSupabaseClient } from '@/lib/database/server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import type { AppRole } from '@/lib/types/common.types'
import { getAppRole } from '@/lib/types/common.types'

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

  const userRole = getAppRole(user as any)
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

  if (!user || !['app_admin', 'app_super_admin'].includes(getAppRole(user as any) as AppRole)) {
    redirect('/auth/login?from=admin')
  }
  return <>{children}</>
}

export async function DriverGuard({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || getAppRole(user as any) !== 'app_driver') {
    redirect('/auth/login?from=driver')
  }
  return <>{children}</>
}

export async function CustomerGuard({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !['app_customer', 'app_admin', 'app_super_admin'].includes(getAppRole(user as any) as AppRole)) {
    redirect('/auth/login')
  }
  return <>{children}</>
}