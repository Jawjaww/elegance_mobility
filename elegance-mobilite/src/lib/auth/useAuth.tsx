"use client";

import { createContext, useContext, useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "./client";
import { UserRole } from "./roles";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  getCurrentUser: () => Promise<User | null>;
  getUserRole: () => UserRole | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  signIn: async () => ({ success: false }),
  signOut: async () => {},
  getCurrentUser: async () => null,
  getUserRole: () => null,
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const initialSessionProcessed = useRef(false);
  const authUnsubscribe = useRef<(() => void) | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const fetchUserData = async (userId: string): Promise<User | null> => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();

      // Vérifie si nous avons une session valide
      if (!sessionData?.session?.user) {
        return null;
      }

      const sessionUser = sessionData.session.user;

      // Vérifie que l'ID correspond
      if (sessionUser.id === userId) {
        // Utiliser les métadonnées de session pour le rôle
        const role = sessionUser.app_metadata?.role || "client";

        // Appeler une fonction RPC sécurisée pour les données additionnelles
        const { data: additionalData, error } = await supabase.rpc(
          "get_user_profile",
          {
            user_id: userId,
          }
        );

        if (error) {
          console.error("Erreur récupération profil:", error);
          return {
            ...sessionUser,
            role,
          };
        }

        return {
          ...sessionUser,
          ...additionalData,
          role,
          email: sessionUser.email,
        };
      }

      // Fallback: récupérer l'utilisateur via getUser
      const { data: userData, error: userError } = await supabase.auth.getUser(
        userId
      );
      return userError ? null : userData.user;
    } catch (error) {
      console.error("Erreur récupération utilisateur:", error);
      return null;
    }
  };

  useEffect(() => {
    if (authUnsubscribe.current) {
      authUnsubscribe.current();
      authUnsubscribe.current = null;
    }

    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const userProfile = await fetchUserData(session.user.id);
          setUser(userProfile || session.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Erreur authentification:", err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
        initialSessionProcessed.current = true;
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "TOKEN_REFRESHED") return;

      if (event === "INITIAL_SESSION") {
        if (initialSessionProcessed.current) return;
        initialSessionProcessed.current = true;

        if (session?.user) {
          const userProfile = await fetchUserData(session.user.id);
          setUser(userProfile || session.user);
          setIsAuthenticated(true);
        }
        return;
      }

      if (event === "SIGNED_IN" && session?.user) {
        const userProfile = await fetchUserData(session.user.id);
        setUser(userProfile || session.user);
        setIsAuthenticated(true);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setIsAuthenticated(false);

        // Redirection selon le contexte
        const isBackoffice = pathname?.includes("/backoffice");
        const isDriver = pathname?.includes("/driver");

        if (isBackoffice) {
          router.push("/auth/admin-login?redirectTo=/backoffice");
        } else if (isDriver) {
          router.push("/auth/driver-login?redirectTo=/driver");
        } else if (
          pathname?.includes("/client") ||
          pathname?.includes("/my-account")
        ) {
          router.push("/auth/login");
        }
      }
    });

    authUnsubscribe.current = () => subscription.unsubscribe();
    return () => {
      if (authUnsubscribe.current) authUnsubscribe.current();
    };
  }, [pathname, router]);

  const signIn = async (email: string, password: string) => {
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

      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });

      return { success: true };
    } catch (error: any) {
      console.error("Erreur de connexion:", error);
      return {
        success: false,
        error: error.message || "Erreur de connexion inconnue",
      };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Erreur de déconnexion:", error);
      toast({
        title: "Erreur de déconnexion",
        description: "Un problème est survenu lors de la déconnexion.",
        variant: "destructive",
      });
    }
  };

  const getCurrentUser = async (): Promise<User | null> => {
    try {
      if (user) return user;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const userProfile = await fetchUserData(session.user.id);
      return userProfile || session.user;
    } catch (error) {
      console.error("Erreur récupération utilisateur:", error);
      return null;
    }
  };

  const getUserRole = (): UserRole | null => {
    if (!user) return null;

    const dbRole = (user as any).role;
    const metadataRole = user.app_metadata?.role || user.user_metadata?.role;

    return (dbRole || metadataRole || "client") as UserRole;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        signIn,
        signOut,
        getCurrentUser,
        getUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
