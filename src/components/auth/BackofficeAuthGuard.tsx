"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/database/client";
import { isUserAdmin } from "@/lib/utils/auth-helpers";
import {
  buildBackofficeLoginUrl,
  isBackofficeProtectedPath,
} from "@/lib/auth/backoffice-auth";
import { useToast } from "@/hooks/useToast";

type GuardState = "checking" | "allowed" | "redirecting";

/**
 * Client-side gate for backoffice routes (Tauri-compatible).
 * Redirects unauthenticated or non-admin users to the admin login page.
 */
export function BackofficeAuthGuard({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [state, setState] = useState<GuardState>("checking");
  const redirectingRef = useRef(false);

  useEffect(() => {
    if (!isBackofficeProtectedPath(pathname)) {
      setState("allowed");
      return;
    }

    let cancelled = false;

    const redirectToLogin = (reason?: "signed_out" | "forbidden") => {
      if (redirectingRef.current || !pathname) return;
      redirectingRef.current = true;
      setState("redirecting");

      if (reason === "forbidden") {
        toast({
          title: "Accès refusé",
          description: "Cet espace est réservé aux administrateurs.",
          variant: "destructive",
        });
      }

      router.replace(buildBackofficeLoginUrl(pathname));
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

        if (!isUserAdmin(user)) {
          redirectToLogin("forbidden");
          return;
        }

        redirectingRef.current = false;
        setState("allowed");
      } catch (error) {
        console.error("[BackofficeAuthGuard] session check failed:", error);
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
        if (!user || !isUserAdmin(user)) {
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
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
