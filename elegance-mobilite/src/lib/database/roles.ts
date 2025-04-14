/**
 * Utilitaires pour la gestion des rôles utilisateur
 * Utilise directement les rôles PostgreSQL natifs de Supabase
 */

import { SupabaseRole } from '@/lib/types/auth.types';

/**
 * Vérifie si l'utilisateur a le rôle spécifié
 */
export function hasRole(userRole: SupabaseRole | undefined | null, role: SupabaseRole): boolean {
  if (!userRole) return false;
  return userRole === role;
}

/**
 * Vérifie si l'utilisateur est un administrateur (normal ou super)
 */
export function isAdmin(userRole: SupabaseRole | undefined | null): boolean {
  if (!userRole) return false;
  return userRole === 'app_admin' || userRole === 'app_super_admin';
}

/**
 * Vérifie si l'utilisateur est un super administrateur
 */
export function isSuperAdmin(userRole: SupabaseRole | undefined | null): boolean {
  if (!userRole) return false;
  return userRole === 'app_super_admin';
}

/**
 * Vérifie si l'utilisateur est un chauffeur
 */
export function isDriver(userRole: SupabaseRole | undefined | null): boolean {
  if (!userRole) return false;
  return userRole === 'app_driver';
}

/**
 * Vérifie si l'utilisateur est un client
 */
export function isCustomer(userRole: SupabaseRole | undefined | null): boolean {
  if (!userRole) return false;
  return userRole === 'app_customer';
}

/**
 * Récupère le rôle principal de l'utilisateur
 */
export function getPrimaryRole(userRole: SupabaseRole | undefined | null): SupabaseRole | null {
  if (!userRole) return null;
  return userRole;
}

/**
 * Récupère le rôle de l'utilisateur à partir de la session
 */
export function getUserRole(user: any): SupabaseRole | null {
  if (!user) return null;
  
  // Accéder directement au rôle PostgreSQL natif
  const role = user.role as SupabaseRole | undefined;
  return role || null;
}
