"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import { AuthModal } from "./AuthModal";
import { useRouter, useSearchParams } from "next/navigation";
import { getUserRole } from "@/lib/utils/auth-helpers";
import { getOptionalAuthUser } from "@/lib/utils/auth-session-check";
import {
  AuthFormShell,
  AuthLoadingSpinner,
} from "@/components/landing/AuthFormShell";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams?.get("from");
  const [isChecking, setIsChecking] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    const checkSession = async () => {
      try {
        const user = await getOptionalAuthUser();

        if (user && !hasRedirected.current) {
          hasRedirected.current = true;
          const role = getUserRole(user);
          if (role === "app_driver") router.replace("/driver-portal/dashboard");
          else if (role === "app_admin" || role === "app_super_admin")
            router.replace("/backoffice-portal");
          else router.replace("/my-account");
          return;
        }

        setIsChecking(false);
      } catch (error) {
        console.error("Erreur vérification session:", error);
        setIsChecking(false);
      }
    };

    checkSession();
  }, [router]);

  const handleClose = () => {
    if (from) {
      router.push("/");
    } else {
      router.back();
    }
  };

  if (isChecking) {
    return <AuthLoadingSpinner />;
  }

  return (
    <AuthFormShell
      kicker="Compte"
      title="Connexion"
      description="Entrez vos identifiants pour accéder à votre compte."
    >
      <AuthModal open={true} onClose={handleClose} embedded={true} />
    </AuthFormShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthFormShell kicker="Compte" title="Connexion" description="Chargement…">
          <AuthLoadingSpinner />
        </AuthFormShell>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
