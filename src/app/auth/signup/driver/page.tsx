"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/database/client";
import { getAppRole } from "@/lib/types/common.types";
import { useRouter } from "next/navigation";
import ModernDriverSignup from "@/components/auth/ModernDriverSignup";
import { PageLoading } from "@/components/ui/loading";

export default function DriverSignupPage() {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const role = getAppRole(user);
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

  // Loading minimal
  if (isChecking) {
    return <PageLoading />;
  }

  return <ModernDriverSignup />;
}
