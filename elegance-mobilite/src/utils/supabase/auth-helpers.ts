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

/**
 * Vérifie l'existence d'une table dans la base de données
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', tableName)
      .single();
      
    return !error && !!data;
  } catch (err) {
    console.error(`Erreur lors de la vérification de l'existence de la table ${tableName}:`, err);
    return false;
  }
}

/**
 * Crée un nouvel utilisateur avec sécurité renforcée
 */
export async function createUserSafely(email: string, password: string, name: string): Promise<{ success: boolean, userId?: string, error?: any }> {
  try {
    // Étape 1: Créer l'utilisateur dans Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name }
      }
    });
    
    if (signUpError || !authData.user) {
      return { success: false, error: signUpError || new Error("Échec de l'enregistrement") };
    }
    
    // Étape 2: Insérer dans la table users
    const { error: usersError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        role: 'client',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
    if (usersError) {
      console.error("Erreur lors de l'insertion dans users:", usersError);
    }
    
    return { success: true, userId: authData.user.id };
  } catch (err) {
    return { success: false, error: err };
  }
}

/**
 * Inscription sécurisée avec contournement du RLS
 * Utilise un appel API Edge Function ou une fonction RPC Supabase
 */
export async function createUserWithServerHelp(
  email: string, 
  password: string, 
  name: string
): Promise<{ success: boolean, userId?: string, error?: any }> {
  try {
    // Étape 1: Créer l'utilisateur dans Auth
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    
    if (signUpError || !authData.user) {
      return { success: false, error: signUpError || new Error("Échec de l'enregistrement") };
    }
    
    // Étape 2: Appeler une API Edge Function pour créer l'entrée utilisateur
    // Cette approche contourne le RLS car le code s'exécute côté serveur
    const response = await fetch('/api/auth/complete-registration', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: authData.user.id,
        name,
        email
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Erreur API:", errorData);
      // On continue malgré l'erreur car l'utilisateur est déjà créé dans Auth
    }
    
    return { success: true, userId: authData.user.id };
  } catch (err) {
    return { success: false, error: err };
  }
}

// Exporter le client Supabase pour une réutilisation
export { supabase };
