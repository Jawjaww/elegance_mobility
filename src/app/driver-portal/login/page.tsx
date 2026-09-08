"use client";

import { DriverLoginForm } from "@/app/driver-portal/login/DriverLoginForm";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/database/client";
import { getUserRole } from "@/lib/utils/auth-helpers";
import Link from "next/link";
import { PublicPageShell } from "@/components/landing/PublicPageShell";
import {
  AuthFormShell,
  AuthLoadingSpinner,
} from "@/components/landing/AuthFormShell";
import { LANDING_LINK, LANDING_PAGE_MAIN } from "@/components/landing/landingSurface";

export default function DriverLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;

    const checkSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user && !hasChecked.current) {
          hasChecked.current = true;

          const role = getUserRole(user);
          if (role === "app_driver") {
            router.replace("/driver-portal/dashboard");
          } else if (role === "app_admin" || role === "app_super_admin") {
            router.replace("/backoffice-portal");
          } else {
            router.replace("/my-account");
          }
          return;
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Erreur vérification session:", error);
        setIsLoading(false);
      }
    };

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <PublicPageShell>
        <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center">
          <AuthLoadingSpinner />
        </div>
      </PublicPageShell>
    );
  }

  return (
    <PublicPageShell>
      <div className={LANDING_PAGE_MAIN}>
        <AuthFormShell
          kicker="Partenaire"
          title="Connexion chauffeur"
          description="Accès réservé aux chauffeurs partenaires."
        >
          <DriverLoginForm />
          <div className="mt-6 space-y-2 text-center text-sm text-neutral-400">
            <p>
              Pas encore partenaire ?{" "}
              <Link href="/auth/signup/driver" className={`font-medium ${LANDING_LINK}`}>
                Rejoindre l&apos;équipe
              </Link>
            </p>
            <Link href="/" className="text-neutral-500 hover:text-neutral-300">
              Retour à l&apos;accueil
            </Link>
          </div>
        </AuthFormShell>
      </div>
    </PublicPageShell>
  );
}
