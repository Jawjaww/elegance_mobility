"use client";

import React, { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url?: string;  // Ajouter le support pour l'avatar
  phone?: string;      // Ajouter aussi le téléphone pour cohérence
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<boolean>;
  updateProfile: (data: Partial<User>) => Promise<boolean>;
}

const defaultAuthContext: AuthContextType = {
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: async () => false,
  logout: () => {},
  register: async () => false,
  updateProfile: async () => false,
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer la session active
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session?.user) {
          // Créer un objet utilisateur de base avec les données de session
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Utilisateur',
            role: 'client', // Valeur par défaut
            avatar_url: session.user.user_metadata?.avatar_url || undefined
          };
          
          // Tenter de récupérer le rôle de l'utilisateur depuis la table users
          try {
            const { data: userRecord } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .single();
              
            if (userRecord) {
              userData.role = userRecord.role;
            }
          } catch (profileError) {
            console.error("Erreur non bloquante lors de la récupération du rôle:", profileError);
          }
          
          setUser(userData);
        }
      } catch (error) {
        console.error("Erreur lors de la vérification d'authentification:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Configurer la souscription aux événements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Utilisateur connecté
          const { data: userRecord } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
            
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Utilisateur',
            role: userRecord?.role || 'client'
          });
        } else if (event === 'SIGNED_OUT') {
          // Utilisateur déconnecté
          setUser(null);
        }
      }
    );

    checkAuth();

    // Nettoyer la souscription lors du démontage
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Fonction de connexion
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error("Erreur de connexion:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  // Fonction d'inscription
  const register = async (email: string, password: string, name: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      console.log("Début de l'inscription pour:", email);
      
      // Inscription avec Supabase Auth en incluant le nom dans les métadonnées
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (signUpError) {
        console.error("Erreur lors de l'inscription Auth:", signUpError);
        return false;
      }

      if (!authData.user) {
        console.error("Pas d'utilisateur créé");
        return false;
      }

      console.log("Utilisateur Auth créé:", authData.user.id);

      // 2. Insérer dans la table users directement
      if (authData.session) {
        // Si l'utilisateur est connecté automatiquement, on peut utiliser l'API directe
        try {
          const { error: usersError } = await supabase
            .from('users')
            .insert([
              {
                id: authData.user.id,
                role: 'client'
                // created_at et updated_at sont gérés par défaut
              }
            ]);

          if (usersError) {
            console.error("Erreur lors de l'insertion users:", usersError);
            // On continue malgré l'erreur
          }
        } catch (dbError) {
          console.error("Exception lors de l'insertion:", dbError);
        }
      } else {
        // L'utilisateur devra confirmer son email avant de pouvoir se connecter
        console.log("Email de confirmation envoyé à l'utilisateur");
      }

      return true;
    } catch (error) {
      console.error("Erreur détaillée d'inscription:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de mise à jour du profil
  const updateProfile = async (userData: Partial<User>): Promise<boolean> => {
    try {
      if (!user?.id) {
        throw new Error("Utilisateur non connecté");
      }

      // Mettre à jour le profil dans la base de données
      const { error } = await supabase
        .from('users')
        .update({
          full_name: userData.name,
          phone: userData.phone,
          avatar_url: userData.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        throw error;
      }

      // Mettre à jour l'état local
      setUser(prev => prev ? { ...prev, ...userData } : null);
      
      return true;
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      return false;
    }
  };

  const value = {
    isAuthenticated: !!user,
    isLoading,
    user,
    login,
    logout,
    register,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
