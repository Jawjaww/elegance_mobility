"use client";

import React, { useEffect, useState, createContext, useContext, ReactNode } from "react";
import { createClient } from "@/utils/supabase/client";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
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
          // Utilisez uniquement les données de session pour le moment
          // pour éviter les erreurs RLS
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.email?.split('@')[0] || 'Utilisateur',
            phone: '',
            avatar_url: '',
          });
          
          // Tentative de récupération des informations supplémentaires en tant que service secondaire
          // qui ne bloquera pas l'affichage de l'interface
          try {
            const { data: profile } = await supabase
              .from('users')
              .select('role, full_name, phone, avatar_url')
              .eq('id', session.user.id)
              .single();
              
            if (profile) {
              setUser(prev => ({
                ...prev!,
                name: profile.full_name || prev!.name,
                phone: profile.phone || '',
                avatar_url: profile.avatar_url || '',
              }));
            }
          } catch (profileError) {
            console.error("Erreur non bloquante lors de la récupération du profil:", profileError);
            // Continue sans bloquer l'expérience utilisateur
          }
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
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            name: profile?.full_name || session.user.email?.split('@')[0] || 'Utilisateur',
            phone: profile?.phone || '',
            avatar_url: profile?.avatar_url || '',
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
      
      // Inscription avec Supabase
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError || !authUser) {
        throw signUpError || new Error("Échec de l'inscription");
      }

      // Créer ou mettre à jour le profil utilisateur
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: authUser.id,
          full_name: name,
          email,
          updated_at: new Date().toISOString(),
        });

      if (profileError) {
        console.error("Erreur lors de la création du profil:", profileError);
      }

      return true;
    } catch (error) {
      console.error("Erreur d'inscription:", error);
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
