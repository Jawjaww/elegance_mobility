"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/database/client";
import { getAppRole } from "@/lib/types/common.types";

interface AuthCheckProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
}

/**
 * Vérification côté client de l'authentification
 * Plus rapide sur Safari que la vérification côté serveur
 */
export function AuthCheck({
  children,
  allowedRoles,
  redirectTo = "/auth/login",
}: AuthCheckProps) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!user) {
        // Pas connecté, rediriger
        window.location.href = redirectTo;
        return;
      }

      // Vérifier le rôle si spécifié
      if (allowedRoles && allowedRoles.length > 0) {
        const userRole = getAppRole(user);
        if (!allowedRoles.includes(userRole || "")) {
          window.location.href = redirectTo;
          return;
        }
      }
    };

    checkAuth();
  }, [redirectTo, allowedRoles]);

  return <>{children}</>;
}
