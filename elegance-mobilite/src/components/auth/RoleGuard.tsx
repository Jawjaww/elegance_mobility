import { getServerUser } from '@/lib/database/server'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import type { AppRole, User } from '@/lib/types/common.types'
import { getAppRole } from '@/lib/types/common.types'

interface RoleGuardProps {
  children: ReactNode
  allowedRoles: AppRole[]
  redirectTo?: string
}

/**
 * Vérifie l'accès pour les rôles donnés
 */
export async function checkAccess(allowedRoles: AppRole[], redirectTo: string = '/auth/login'): Promise<User | null> {
  const user = await getServerUser()

  if (!user) {
    redirect(`${redirectTo}?from=${encodeURIComponent(redirectTo)}`)
  }

  const userRole = getAppRole(user)
  if (!userRole || !allowedRoles.includes(userRole as AppRole)) {
    redirect('/unauthorized')
  }
  
  return user
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
  const user = await getServerUser()

  const userRole = getAppRole(user)
  if (!user || !['app_admin', 'app_super_admin'].includes(userRole as AppRole)) {
    // Utiliser la page login admin dédiée
    redirect('/backoffice-portal/login')
  }
  return <>{children}</>
}

export async function DriverGuard({ children }: { children: ReactNode }) {
  const user = await getServerUser()

  const userRole = getAppRole(user)
  if (!user || userRole !== 'app_driver') {
    // Ajouter redirectTo pour éviter la boucle auto-redirect côté client
    redirect('/auth/login?from=driver&redirectTo=/driver-portal/dashboard')
  }
  return <>{children}</>
}

export async function CustomerGuard({ children }: { children: ReactNode }) {
  const user = await getServerUser()

  const userRole = getAppRole(user)
  if (!user || !['app_customer', 'app_admin', 'app_super_admin'].includes(userRole as AppRole)) {
    // Ajouter redirectTo pour éviter la boucle auto-redirect côté client
    redirect('/auth/login?redirectTo=/my-account')
  }
  return <>{children}</>
}