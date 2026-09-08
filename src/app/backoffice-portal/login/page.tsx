"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { AdminLoginForm } from "./AdminLoginForm";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/database/client";
import { isUserAdmin } from "@/lib/utils/auth-helpers";
import { resolveBackofficePostLoginPath } from "@/lib/auth/backoffice-auth";
import { PublicPageShell } from "@/components/landing/PublicPageShell";
import {
  AuthFormShell,
  AuthLoadingSpinner,
} from "@/components/landing/AuthFormShell";

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    const checkSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && !hasRedirected.current && isUserAdmin(user)) {
          hasRedirected.current = true;
          router.replace(
            resolveBackofficePostLoginPath(searchParams?.get("next") ?? null),
          );
          return;
        }
      } catch (error) {
        console.error("Erreur vérification session:", error);
      } finally {
        setIsChecking(false);
      }
    };

    void checkSession();
  }, [router, searchParams]);

  if (isChecking) {
    return (
      <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center">
        <AuthLoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-10">
      <AuthFormShell
        kicker="Équipe"
        title="Connexion administrateur"
        description="Accès réservé aux administrateurs."
      >
        <AdminLoginForm />
        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-neutral-500 hover:text-neutral-300"
          >
            Retour à l&apos;accueil
          </Link>
        </div>
      </AuthFormShell>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <PublicPageShell>
      <Suspense
        fallback={
          <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center">
            <AuthLoadingSpinner />
          </div>
        }
      >
        <AdminLoginPageContent />
      </Suspense>
    </PublicPageShell>
  );
}
