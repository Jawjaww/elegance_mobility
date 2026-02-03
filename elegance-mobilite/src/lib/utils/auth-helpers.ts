/**
 * Helpers d'authentification standardisés
 * 
 * Ces fonctions garantissent une récupération cohérente des données utilisateur
 * alignée avec la base de données.
 */

import { User } from '@supabase/supabase-js'
import { AppRole } from '@/lib/types/common.types'
import { getEffectiveRole, ROLES } from './roles'

/**
 * Extrait le rôle applicatif d'un utilisateur Supabase
 * 
 * Source de vérité : user.app_metadata.role
 * (correspond à raw_app_meta_data->>'role' côté BDD)
 * 
 * Note : user.user_metadata ne doit PAS être utilisé pour les rôles
 * car il est client-side et non sécurisé
 */
export function getUserRole(user: User | null | undefined): AppRole {
  if (!user) return ROLES.CUSTOMER
  
  // Source de vérité : app_metadata (serveur)
  // Dans Supabase, raw_app_meta_data côté BDD devient app_metadata côté client
  const role = user.app_metadata?.role as AppRole | undefined
  
  return getEffectiveRole(role)
}

/**
 * Vérifie si l'utilisateur a un rôle spécifique
 */
export function userHasRole(user: User | null | undefined, role: AppRole): boolean {
  return getUserRole(user) === role
}

/**
 * Récupère les métadonnées utilisateur sécurisées (app_metadata uniquement)
 */
export function getSecureUserMetadata(user: User | null | undefined) {
  if (!user) return null
  
  return {
    role: user.app_metadata?.role as AppRole | undefined,
    // Ajouter d'autres champs app_metadata si nécessaire
  }
}

/**
 * Détermine le type de portail vers lequel rediriger l'utilisateur
 */
export function getPortalRedirectUrl(user: User | null | undefined): string {
  const role = getUserRole(user)
  
  switch (role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return '/backoffice-portal'
    case ROLES.DRIVER:
      return '/driver-portal'
    case ROLES.CUSTOMER:
    default:
      return '/dashboard'
  }
}

/**
 * Type guard pour vérifier le rôle
 */
export function isUserAdmin(user: User | null | undefined): boolean {
  const role = getUserRole(user)
  return role === ROLES.ADMIN || role === ROLES.SUPER_ADMIN
}

export function isUserSuperAdmin(user: User | null | undefined): boolean {
  return getUserRole(user) === ROLES.SUPER_ADMIN
}

export function isUserDriver(user: User | null | undefined): boolean {
  return getUserRole(user) === ROLES.DRIVER
}

export function isUserCustomer(user: User | null | undefined): boolean {
  return getUserRole(user) === ROLES.CUSTOMER
}
