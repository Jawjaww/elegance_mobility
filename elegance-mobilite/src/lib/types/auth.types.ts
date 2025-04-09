import type { User } from '@supabase/supabase-js';

// Rôles natifs de Supabase
export type SupabaseRole = 'app_super_admin' | 'app_admin' | 'app_driver' | 'app_customer' | 'unauthorized';

// L'alias UserRole n'est plus nécessaire
// export type UserRole = Exclude<SupabaseRole, 'unauthorized'>;

export interface AuthUser {
  id: string;
  email?: string; // Rendre optionnel
  role: SupabaseRole; // Utiliser SupabaseRole directement
  name?: string; // Rendre optionnel
  user_metadata?: { // Rendre optionnel pour correspondre à server.ts
    name?: string;
    phone?: string; // Ajouté pour correspondre à server.ts
    avatar_url?: string; // Ajouté pour correspondre à server.ts
    [key: string]: any;
  };
}

// Type utilitaire pour la réponse RPC des rôles
export interface UserRoleResponse {
  role: SupabaseRole; // Utiliser SupabaseRole directement
}
