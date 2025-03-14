"use client";

import {
  useState,
  useEffect,
  useContext,
  createContext,
  ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from '@/utils/supabase/client';
import { User, UserRole, AdminLevel } from '../types/auth.types';

// Types et contexte
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userData?: any) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  getUserRole: () => UserRole | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionChecked, setSessionChecked] = useState(false); // Nouvel état pour suivre si la session a été vérifiée
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  // Définir un set d'erreurs déjà vues pour éviter les doublons
  const errorsSeen = new Set();

  // Fonction utilitaire pour créer un utilisateur en toute sécurité
  const createUserSafely = async (userId: string, role: UserRole = 'client') => {
    try {
      // Créer l'utilisateur dans la table users si nécessaire
      await supabase
        .from('users')
        .insert([{
          id: userId,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      // Récupérer l'utilisateur créé ou existant
      return await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
        
    } catch (error: any) {
      // Si c'est une violation de clé primaire, on ignore - l'utilisateur existe déjà
      if (error.code === '23505') {
        // Tenter de récupérer l'utilisateur existant
        return await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
      }
      
      // Log une seule fois par type d'erreur
      if (!errorsSeen.has(error.message)) {
        console.warn("Erreur lors de la création/récupération utilisateur:", error.message);
        errorsSeen.add(error.message);
      }
      
      return { data: null, error };
    }
  };

  // Fonction pour rafraîchir les données utilisateur
  const refreshUserData = async (userId: string): Promise<User | null> => {
    try {
      // Récupérer directement depuis la BD avec gestion des erreurs
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      if (!userData) return null;
      
      // Convertir en type User
      const userObj: User = {
        id: userData.id,
        role: userData.role as UserRole,
        admin_level: userData.admin_level as AdminLevel | undefined,
        created_at: userData.created_at,
        updated_at: userData.updated_at
      };
      
      return userObj;
    } catch (error) {
      console.warn("Impossible de récupérer les données utilisateur:", error);
      return null;
    }
  };

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    // Ne vérifier qu'une seule fois au chargement initial
    if (sessionChecked) return;
    
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        
        // Récupérer la session active
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Erreur lors de la vérification de la session:", error);
          setIsLoading(false);
          setSessionChecked(true);
          return;
        }
        
        if (session?.user) {
          // Utilisateur connecté - ne pas rediriger
          console.log("Session active détectée, utilisateur connecté");
          setIsAuthenticated(true);
          
          // S'il existe déjà un objet user, éviter de le recréer
          if (user && user.id === session.user.id) {
            console.log("État utilisateur conservé");
            setIsLoading(false);
            setSessionChecked(true);
            return;
          }
          
          // Utilisateur connecté dans Supabase Auth
          const userId = session.user.id;
          
          try {
            // Récupérer le profil utilisateur
            const userProfile = await refreshUserData(userId);
            
            if (userProfile) {
              setUser(userProfile);
            } else {
              // Profil minimal en attendant que la BD se synchronise
              setUser({
                id: userId,
                role: 'client',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
            
            // Attendre un peu pour s'assurer que l'état est mis à jour
            await new Promise(resolve => setTimeout(resolve, 100));
            
            setIsAuthenticated(true);
          } catch (dbError) {
            console.error("Erreur BD non bloquante:", dbError);
            // Créer un utilisateur minimal
            setUser({
              id: userId,
              role: 'client',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
            setIsAuthenticated(true);
          }
        } else {
          // Pas de session active
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Erreur d'authentification:", err);
        // Ne pas effacer l'utilisateur en cas d'erreur de vérification
        if (!user) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        setIsLoading(false);
        setSessionChecked(true);
      }
    };

    checkAuth();

    // Configurer un écouteur pour les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Changement d'état d'authentification:", event);
        
        // Pour TOKEN_REFRESHED, maintenir explicitement l'état authentifié
        if (event === 'TOKEN_REFRESHED') {
          console.log("Token rafraîchi, conservation de l'état utilisateur existant");
          setIsAuthenticated(true); 
          return;
        }
        
        // Pour INITIAL_SESSION, ne pas rediriger l'utilisateur déjà authentifié
        if (event === 'INITIAL_SESSION') {
          if (session) {
            console.log("Session initiale détectée - authentifié");
            setIsAuthenticated(true);
            
            // Mettre à jour l'utilisateur si nécessaire mais sans redirection
            if (!user && session.user) {
              const userProfile = await refreshUserData(session.user.id);
              if (userProfile) {
                setUser(userProfile);
              } else {
                setUser({
                  id: session.user.id,
                  role: 'client',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
              }
            }
          }
          return;
        }
        
        // Autres événements comme d'habitude...
        if (event === 'SIGNED_IN' && session) {
          try {
            // Récupérer le profil utilisateur
            const userId = session.user.id;
            const userProfile = await refreshUserData(userId);
            
            if (userProfile) {
              // Utilisateur trouvé dans la BD
              setUser(userProfile);
              setIsAuthenticated(true);
            } else {
              // Utilisateur non trouvé, essayer de le créer
              const { data: newUserData, error: createError } = await createUserSafely(userId);
              
              if (newUserData && !createError) {
                setUser({
                  id: newUserData.id,
                  role: newUserData.role as UserRole,
                  admin_level: newUserData.admin_level as AdminLevel | undefined,
                  created_at: newUserData.created_at,
                  updated_at: newUserData.updated_at
                });
                setIsAuthenticated(true);
              } else {
                // Échec de création, utiliser un objet User minimal
                setUser({
                  id: userId,
                  role: 'client',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                });
                setIsAuthenticated(true);
              }
            }
          } catch (error) {
            console.error("Erreur lors de la récupération/création utilisateur:", error);
            
            if (session?.user?.id) {
              // Utiliser données minimales en cas d'erreur
              setUser({
                id: session.user.id,
                role: 'client', 
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
              setIsAuthenticated(true);
            } else {
              setUser(null);
              setIsAuthenticated(false);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setIsAuthenticated(false);
          if (pathname?.startsWith('/admin') || pathname?.startsWith('/my-account')) {
            router.push('/');
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router, user, sessionChecked]);

  // Fonction de connexion
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      // Délai court pour laisser le temps à la session de se propager
      await new Promise(resolve => setTimeout(resolve, 500));
      
      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });

      return { success: true };
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      return { success: false, error: error.message || "Erreur de connexion inconnue" };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction d'inscription
  const signUp = async (email: string, password: string, userData?: any): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        return { success: false, error: error.message };
      }

      // Créer l'entrée dans la table users
      if (data?.user?.id) {
        await createUserSafely(data.user.id, 'client');
      }

      toast({
        title: "Inscription réussie",
        description: "Veuillez vérifier votre email pour confirmer votre compte.",
      });

      return { success: true };
    } catch (error: any) {
      console.error("Erreur d'inscription:", error);
      return { success: false, error: error.message || "Erreur d'inscription inconnue" };
    } finally {
      setIsLoading(false);
    }
  };

  // Fonction de déconnexion
  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      router.push('/');
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
    }
  };

  // Fonction pour récupérer l'utilisateur actuel
  const getCurrentUser = async (): Promise<User | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return null;

      return await refreshUserData(session.user.id);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return null;
    }
  };

  // Fonction pour récupérer uniquement le rôle de l'utilisateur
  const getUserRole = (): UserRole | null => {
    return user?.role || null;
  };

  // Exposer les fonctions et état via le contexte
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signIn,
        signUp,
        signOut,
        getCurrentUser,
        getUserRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook pour utiliser l'authentification
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé à l'intérieur d'un AuthProvider");
  }
  return context;
};
