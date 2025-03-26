/**
 * Native PostgreSQL roles used in the application
 * These roles are managed directly in the database
 */
export type PostgresRole = 'app_super_admin' | 'app_admin' | 'app_driver' | 'app_customer';

/**
 * User session with native role information from Supabase auth
 */
export interface AuthUser {
  id: string;
  email?: string;
  role: PostgresRole;
}

/**
 * Authentication errors
 */
export type AuthError = 
  | 'not_authenticated'
  | 'insufficient_permissions'
  | 'invalid_credentials'
  | 'internal';

/**
 * Role validation helpers
 */
export const isValidRole = (role?: string): role is PostgresRole => {
  return ['app_super_admin', 'app_admin', 'app_driver', 'app_customer'].includes(role || '');
}

export const hasAdminAccess = (role?: string): boolean => {
  return role === 'app_super_admin' || role === 'app_admin';
}

export const hasSuperAdminAccess = (role?: string): boolean => {
  return role === 'app_super_admin';
}

export const isDriver = (role?: string): boolean => {
  return role === 'app_driver';
}
