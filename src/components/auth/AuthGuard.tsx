"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/database/client";
import { useRoleNavigation } from "@/lib/auth/navigation.client";
import { usePathname } from "next/navigation";

/**
 * AuthGuard — Protection client-side des routes
 *
 * Remplace le middleware serveur pour compatibilité Tauri.
 * Écoute les changements d'authentification et redirige selon le rôle.
 */
export function AuthGuard({ children }: Readonly<{ children: React.ReactNode }>) {
  const { redirectToRoleHome } = useRoleNavigation();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Vérification initiale : protéger les routes privées uniquement
    const checkInitialSession = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        const publicPaths = [
          "/auth/login",
          "/auth/signup",
          "/auth/signup/driver",
          "/reservation",
          "/contact",
        ];
        // Do NOT include "/" here — pathname.startsWith("/") matches every route.

        const isPublicPath =
          pathname === "/" ||
          (pathname &&
            publicPaths.some((path) => pathname.startsWith(path)));

        // Si pas d'utilisateur ET route privée → redirect login
        if ((error || !user) && !isPublicPath) {
          redirectToRoleHome(null);
        }

        // NE JAMAIS rediriger les utilisateurs connectés
        // LoginForm et already-connected gèrent leur navigation eux-mêmes
      } catch (error) {
        console.error("[AuthGuard] Erreur vérification initiale:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkInitialSession();

    // Écouter uniquement les déconnexions
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(
        "[AuthGuard] Auth event:",
        event,
        "Role:",
        session?.user?.app_metadata?.role,
      );

      // SIGNED_OUT : rediriger vers login depuis routes privées
      if (event === "SIGNED_OUT") {
        const publicPaths = [
          "/auth/login",
          "/auth/signup",
          "/auth/signup/driver",
          "/reservation",
          "/contact",
        ];
        const isPublicPath =
          pathname === "/" ||
          (pathname &&
            publicPaths.some((path) => pathname.startsWith(path)));

        if (!isPublicPath) {
          redirectToRoleHome(null);
        }
      }

      // NE PAS rediriger sur SIGNED_IN/INITIAL_SESSION
      // Laisser les pages de login/signup gérer la navigation
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, redirectToRoleHome]);

  // Afficher un loader pendant la vérification initiale (optionnel)
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
