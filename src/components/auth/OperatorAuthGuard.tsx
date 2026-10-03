"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/database/client";
import { isUserOperator } from "@/lib/utils/auth-helpers";
import { useToast } from "@/hooks/useToast";

const OPERATOR_PORTAL_PATH = "/operator-portal";
const OPERATOR_LOGIN_PATH = "/auth/login";

type GuardState = "checking" | "allowed" | "redirecting";

/**
 * URL de connexion, avec la route opérateur en `redirectTo`.
 *
 * Le portail opérateur n'a pas de page de connexion dédiée (contrairement à
 * /backoffice-portal/login) : /auth/login redirige déjà vers `redirectTo` après
 * succès, une seconde route ne ferait que la dupliquer. Seules les routes
 * internes du portail sont transmises, jamais un chemin venu de l'extérieur.
 */
function buildOperatorLoginUrl(returnPath: string | null | undefined): string {
  const isPortalPath =
    returnPath === OPERATOR_PORTAL_PATH ||
    Boolean(returnPath?.startsWith(`${OPERATOR_PORTAL_PATH}/`));
  const target = isPortalPath ? (returnPath as string) : OPERATOR_PORTAL_PATH;
  return `${OPERATOR_LOGIN_PATH}?redirectTo=${encodeURIComponent(target)}`;
}

/**
 * Porte client-side du portail opérateur (compatible Tauri).
 *
 * Le rôle du JWT n'est que la *porte* : il prouve que le compte a le droit
 * d'atteindre le portail. L'appartenance à une flotte — quel opérateur, avec
 * quel rôle — se décide en SQL (public.operator_members) et c'est la page qui
 * la lit, y compris le cas « aucune ligne ».
 */
export function OperatorAuthGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<GuardState>("checking");
  const redirectingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const redirectToLogin = (reason?: "signed_out" | "forbidden") => {
      if (redirectingRef.current) return;
      redirectingRef.current = true;
      setState("redirecting");

      if (reason === "forbidden") {
        toast({
          title: "Accès refusé",
          description: "Cet espace est réservé aux opérateurs.",
          variant: "destructive",
        });
      }

      router.replace(buildOperatorLoginUrl(pathname));
    };

    const verifyAccess = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        let user = session?.user ?? null;

        if (!user) {
          const {
            data: { user: fetchedUser },
          } = await supabase.auth.getUser();
          user = fetchedUser ?? null;
        }

        if (cancelled) return;

        if (!user) {
          redirectToLogin();
          return;
        }

        if (!isUserOperator(user)) {
          redirectToLogin("forbidden");
          return;
        }

        redirectingRef.current = false;
        setState("allowed");
      } catch (error) {
        console.error("[OperatorAuthGuard] session check failed:", error);
        if (!cancelled) redirectToLogin();
      }
    };

    void verifyAccess();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        redirectToLogin("signed_out");
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        const user = session?.user;
        if (!user || !isUserOperator(user)) {
          redirectToLogin(user ? "forbidden" : undefined);
          return;
        }
        redirectingRef.current = false;
        setState("allowed");
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [pathname, router, toast]);

  if (state !== "allowed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
