/**
 * Utilitaires de gestion des rôles - Standardisés avec la BDD
 * 
 * Source de vérité BDD: auth.users.raw_app_meta_data->>'role'
 * 
 * Rôles disponibles:
 * - app_customer: Client standard
 * - app_driver: Chauffeur VTC
 * - app_admin: Administrateur
 * - app_super_admin: Super administrateur
 * 
 * IMPORTANT: Les rôles sont contrôlés côté serveur (raw_app_meta_data)
 * raw_user_meta_data est client-side et ne doit pas être utilisé pour l'autorisation
 */

import { AppRole } from '@/lib/types/common.types'

/**
 * Constantes des rôles pour éviter les fautes de frappe
 */
export const ROLES = {
  CUSTOMER: 'app_customer' as const,
  DRIVER: 'app_driver' as const,
  ADMIN: 'app_admin' as const,
  SUPER_ADMIN: 'app_super_admin' as const,
}

/**
 * Liste de tous les rôles pour validation
 */
export const ALL_ROLES: AppRole[] = [
  ROLES.CUSTOMER,
  ROLES.DRIVER,
  ROLES.ADMIN,
  ROLES.SUPER_ADMIN,
]

/**
 * Vérifie si le rôle est admin (inclut super admin)
 * Correspond à la fonction SQL: is_admin()
 */
export function isAdmin(role: AppRole | null | undefined): boolean {
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN
}

/**
 * Vérifie si c'est un super admin uniquement
 * Correspond à la fonction SQL: is_super_admin()
 */
export function isSuperAdmin(role: AppRole | null | undefined): boolean {
  return role === ROLES.SUPER_ADMIN
}

/**
 * Vérifie si c'est un driver
 * Correspond à la fonction SQL: is_driver()
 */
export function isDriver(role: AppRole | null | undefined): boolean {
  return role === ROLES.DRIVER
}

/**
 * Vérifie si c'est un customer
 * Si pas de rôle défini, considéré comme customer (par défaut)
 * Correspond à la fonction SQL: is_customer()
 */
export function isCustomer(role: AppRole | null | undefined): boolean {
  return role === ROLES.CUSTOMER || !role
}

/**
 * Vérifie si l'utilisateur a un des rôles autorisés
 * Correspond à la fonction SQL: has_any_role(allowed_roles)
 */
export function hasAnyRole(
  userRole: AppRole | null | undefined,
  allowedRoles: AppRole[]
): boolean {
  // Si pas de rôle, considéré comme customer
  const effectiveRole = userRole || ROLES.CUSTOMER
  return allowedRoles.includes(effectiveRole)
}

/**
 * Récupère le rôle effectif (avec fallback customer)
 * Correspond à la fonction SQL: get_user_role()
 */
export function getEffectiveRole(role: AppRole | null | undefined): AppRole {
  return role || ROLES.CUSTOMER
}

/**
 * Vérifie l'accès au portail admin
 */
export function canAccessAdminPortal(role: AppRole | null | undefined): boolean {
  return isAdmin(role)
}

/**
 * Vérifie l'accès au portail driver
 */
export function canAccessDriverPortal(role: AppRole | null | undefined): boolean {
  return isDriver(role)
}

/**
 * Vérifie l'accès au portail client
 */
export function canAccessClientPortal(role: AppRole | null | undefined): boolean {
  return isCustomer(role) || isAdmin(role)
}

/**
 * Vérifie si l'utilisateur peut créer des courses
 * (customers, admins)
 */
export function canCreateRides(role: AppRole | null | undefined): boolean {
  return isCustomer(role) || isAdmin(role)
}

/**
 * Vérifie si l'utilisateur peut accepter des courses
 * (drivers uniquement)
 */
export function canAcceptRides(role: AppRole | null | undefined): boolean {
  return isDriver(role)
}

/**
 * Vérifie si l'utilisateur peut gérer les utilisateurs
 * (admins uniquement)
 */
export function canManageUsers(role: AppRole | null | undefined): boolean {
  return isAdmin(role)
}

/**
 * Vérifie si l'utilisateur peut voir tous les chauffeurs
 * (admins uniquement)
 */
export function canViewAllDrivers(role: AppRole | null | undefined): boolean {
  return isAdmin(role)
}

/**
 * Formate le nom d'affichage du rôle
 */
export function formatRoleName(role: AppRole | null | undefined): string {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return 'Super Administrateur'
    case ROLES.ADMIN:
      return 'Administrateur'
    case ROLES.DRIVER:
      return 'Chauffeur'
    case ROLES.CUSTOMER:
    default:
      return 'Client'
  }
}

/**
 * Récupère la couleur associée au rôle (pour UI)
 */
export function getRoleColor(role: AppRole | null | undefined): string {
  switch (role) {
    case ROLES.SUPER_ADMIN:
      return 'text-red-600 bg-red-50'
    case ROLES.ADMIN:
      return 'text-orange-600 bg-orange-50'
    case ROLES.DRIVER:
      return 'text-blue-600 bg-blue-50'
    case ROLES.CUSTOMER:
    default:
      return 'text-green-600 bg-green-50'
  }
}
