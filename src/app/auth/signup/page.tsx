"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import CustomerSignup from "@/components/auth/CustomerSignup";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/database/client";
import { getUserRole } from "@/lib/utils/auth-helpers";

function SignupContent() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;

    const checkSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

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
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Créer un compte</CardTitle>
        <CardDescription>
          Rejoignez Élégance Mobilité pour réserver vos courses
        </CardDescription>
      </CardHeader>
      <CardContent>
        <CustomerSignup />
      </CardContent>
    </Card>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Créer un compte</CardTitle>
            <CardDescription>Chargement...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
            </div>
          </CardContent>
        </Card>
      }
    >
      <SignupContent />
    </Suspense>
  );
}
