"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import CustomerSignup from "@/components/auth/CustomerSignup";
import { useRouter } from "next/navigation";
import { getUserRole } from "@/lib/utils/auth-helpers";
import { getOptionalAuthUser } from "@/lib/utils/auth-session-check";
import {
  AuthFormShell,
  AuthLoadingSpinner,
} from "@/components/landing/AuthFormShell";

function SignupContent() {
  const router = useRouter();
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

  if (isChecking) {
    return <AuthLoadingSpinner />;
  }

  return (
    <AuthFormShell
      kicker="Compte"
      title="Créer un compte"
      description="Rejoignez Vector Elegans pour réserver vos courses."
    >
      <CustomerSignup />
    </AuthFormShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <AuthFormShell
          kicker="Compte"
          title="Créer un compte"
          description="Chargement…"
        >
          <AuthLoadingSpinner />
        </AuthFormShell>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
