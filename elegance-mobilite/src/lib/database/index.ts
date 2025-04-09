/**
 * Point d'entrée principal pour le système d'authentification
 */

// Exporter les clients Supabase
export { supabase, createBrowserClient } from './client';
// Note: createServerClient doit être importé directement depuis './server'

// Exports des utilitaires de rôles
export { 
  hasRole,
  isAdmin,
  isDriver,
  isClient,
  isSuperAdmin,
  getUserRole,
  getPrimaryRole
} from './roles';

// Re-exporter les types essentiels
export type { UserRole, AdminLevel } from './roles';
export type { User, Session, AuthError } from '@supabase/supabase-js';
