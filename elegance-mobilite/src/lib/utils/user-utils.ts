import { User } from '@/lib/types/auth.types';
import { supabase } from '@/utils/supabase/client';

/**
 * Récupère les métadonnées utilisateur à partir de Supabase Auth
 */
export async function getUserMetadata(userId: string): Promise<any> {
  try {
    // Récupérer les données utilisateur de Supabase Auth
    const { data, error } = await supabase.auth.admin.getUserById(userId);
    
    if (error) {
      console.warn("Erreur lors de la récupération des métadonnées utilisateur:", error);
      return null;
    }
    
    return data?.user?.user_metadata || null;
  } catch (error) {
    console.error("Exception lors de la récupération des métadonnées utilisateur:", error);
    return null;
  }
}

/**
 * Extrait le nom d'utilisateur des métadonnées ou crée un nom d'affichage à partir de l'email
 */
export function extractDisplayName(email: string | null | undefined, metadata: any): string {
  // Si les métadonnées contiennent un nom complet, l'utiliser
  if (metadata?.full_name) {
    return metadata.full_name;
  }
  
  // Sinon, essayer d'extraire un nom à partir de l'email
  if (email) {
    // Récupérer la partie avant @ pour créer un nom d'utilisateur
    const username = email.split('@')[0];
    // Formater pour avoir une majuscule au début
    return username.charAt(0).toUpperCase() + username.slice(1);
  }
  
  // Fallback si aucune information n'est disponible
  return "Utilisateur";
}

/**
 * Récupère les initiales à partir d'un nom complet
 */
export function getInitialsFromName(name: string): string {
  if (!name || typeof name !== 'string') return "EM";
  
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
