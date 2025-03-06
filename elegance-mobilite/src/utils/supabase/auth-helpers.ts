/**
 * Utilitaires pour gérer l'authentification Supabase avec une meilleure gestion d'erreur
 */

import { createBrowserClient } from "@supabase/ssr";

// Utiliser la même instance de client Supabase pour tout le projet
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * Fonction helper pour vérifier la connexion avant d'effectuer des actions d'authentification
 */
export async function checkConnection(): Promise<boolean> {
  try {
    // Effectuer une requête simple pour vérifier la connectivité
    const { error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
      .single();

    // Si pas d'erreur, la connexion fonctionne
    return !error;
  } catch (error) {
    console.error("Erreur lors de la vérification de la connexion:", error);
    return false;
  }
}

/**
 * Fonction robuste pour récupérer une session utilisateur avec gestion des erreurs
 */
export async function getSessionSafely() {
  try {
    const isConnected = await checkConnection();
    
    if (!isConnected) {
      console.warn("Connexion internet non disponible. Utilisant les données en cache si disponibles.");
      // Tentative de récupérer la session du cache local
      return { data: { session: null }, error: new Error("Connexion internet non disponible") };
    }
    
    // Si la connexion est disponible, tenter de récupérer la session
    const { data, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error("Erreur lors de la récupération de la session:", error);
      return { data: { session: null }, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error("Exception lors de la récupération de la session:", error);
    return { data: { session: null }, error };
  }
}

/**
 * Wrapper robuste pour les opérations d'authentification
 */
export async function safeAuthOperation<T>(operation: () => Promise<T>): Promise<{ result: T | null, error: Error | null }> {
  try {
    const isConnected = await checkConnection();
    
    if (!isConnected) {
      return { 
        result: null, 
        error: new Error("Connexion internet non disponible. Veuillez vérifier votre connexion et réessayer.") 
      };
    }
    
    const result = await operation();
    return { result, error: null };
  } catch (error: any) {
    return { result: null, error };
  }
}

// Exporter le client Supabase pour une réutilisation
export { supabase };
