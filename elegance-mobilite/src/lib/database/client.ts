"use client";

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database.types';

// Client Supabase singleton avec typage
export const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false, // Désactiver la persistence côté client
      detectSessionInUrl: false // Désactiver car géré par le middleware
    }
  }
);

// Re-export pour l'utilisation externe
export { createBrowserClient };

// Opérations d'authentification
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    return {
      success: !error,
      error: error?.message
    };
  } catch (error) {
    console.error('Erreur critique lors de la déconnexion:', error);
    return {
      success: false,
      error: 'Échec de la déconnexion'
    };
  }
}

// Re-export des types
export type { AuthUser } from '@/lib/types/auth.types';
