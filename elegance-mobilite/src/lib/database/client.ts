'use client'

import { createBrowserClient } from '@supabase/ssr'

// Client Supabase singleton pour le navigateur
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
      storageKey: 'elegance-auth'
    },
    global: {
      // Ne PAS définir de headers Content-Profile ou Accept-Profile ici !
      // Supabase utilisera le JWT du header Authorization pour appliquer les policies RLS
    },
    db: {
      schema: 'public'
    }
  }
)

// Re-export pour l'utilisation externe
export { createBrowserClient }

/**
 * Détecte si une erreur est liée à un problème de permissions de rôle
 * Cette fonction est utilisée par reservationService pour les tentatives de récupération
 */
export function handleRoleError(error: any): boolean {
  // Vérifier si l'erreur est liée aux permissions de rôle
  if (!error) return false;
  
  const errorMessage = error.message?.toLowerCase() || '';
  const errorCode = error.code;
  const statusCode = error.status || error.statusCode;
  
  // Capture explicitement les erreurs 403 (Forbidden) qui sont souvent liées aux permissions
  return (
    statusCode === 403 ||
    errorMessage.includes('permission denied') || 
    errorMessage.includes('role') ||
    errorMessage.includes('forbidden') ||
    errorCode === '42501' || // Code PostgreSQL pour une violation de permission
    errorCode === 'PGRST116' // Code PostgREST pour permission denied
  );
}

// Helper pour la déconnexion
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('Erreur lors de la déconnexion:', error)
      return {
        success: false,
        error: error.message
      }
    }
    // La redirection sera gérée par le middleware
    return {
      success: true,
      error: null
    }
  } catch (error) {
    console.error('Erreur critique lors de la déconnexion:', error)
    return {
      success: false,
      error: 'Échec de la déconnexion'
    }
  }
}

/**
 * Outil de diagnostic pour les erreurs RLS
 * Affiche les informations détaillées sur l'utilisateur et ses métadonnées
 */
export async function debugRlsProblem() {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error("[RLS DEBUG] Erreur lors de la récupération de l'utilisateur:", userError);
      return {
        success: false,
        error: userError.message,
        details: null
      };
    }
    
    // Informations détaillées sur l'utilisateur
    const userDetails = {
      id: userData?.user?.id,
      email: userData?.user?.email,
      role: userData?.user?.app_metadata?.role || null,
      // Accéder aux métadonnées via app_metadata
      // Note: Dans la BD, c'est raw_app_meta_data, mais dans l'objet User c'est app_metadata
      raw_role: userData?.user?.app_metadata?.role || null,
      metadata: userData?.user?.app_metadata,
      raw_metadata: userData?.user?.app_metadata,
      session_aud: userData?.user?.aud
    };
    
    console.log("[RLS DEBUG] Informations utilisateur complètes:", userDetails);
    
    // Tester explicitement la politique RLS
    const testResult = await supabase
      .from('rides')
      .select('count(*)')
      .limit(1);
      
    console.log("[RLS DEBUG] Test de lecture:", testResult);
    
    return {
      success: true,
      error: null,
      details: userDetails
    };
  } catch (error) {
    console.error("[RLS DEBUG] Erreur critique lors du diagnostic:", error);
    return {
      success: false,
      error: 'Échec du diagnostic RLS',
      details: null
    };
  }
}