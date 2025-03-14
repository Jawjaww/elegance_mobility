/**
 * Types unifiés pour l'authentification Vector Elegans
 */

// Rôles utilisateur standardisés
export type UserRole = 'admin' | 'client' | 'driver';

// Niveau d'accès admin (pour les utilisateurs avec rôle 'admin')
export type AdminLevel = 'super' | 'standard';

// Structure d'un utilisateur dans la base de données publique
export interface User {
  id: string;
  role: UserRole;
  admin_level?: AdminLevel; // Uniquement pour les utilisateurs avec role='admin'
  created_at: string;
  updated_at: string;
}

// Structure pour le profil utilisateur combiné
export interface UserProfile extends User {
  email: string;
  admin_level?: AdminLevel; // Ajout du niveau admin dans le profil utilisateur
  first_name?: string;
  last_name?: string;
  phone?: string;
}

// Options pour les hooks d'autorisation
export interface RouteGuardOptions {
  redirectTo?: string;
  allowedRoles?: UserRole[];
  requiredAdminLevel?: AdminLevel;
  requireProfile?: boolean;
}

// Résultat des hooks d'autorisation
export interface GuardResult {
  isAuthorized: boolean;
  isLoading: boolean;
  profile?: UserProfile | null;
}

// Réponse de session 
export interface SessionResponse {
  data: {
    session: any | null;
  };
  error: Error | null;
}

// Erreur de session
export interface SessionError extends Error {
  message: string;
  code?: string;
  details?: string;
}
