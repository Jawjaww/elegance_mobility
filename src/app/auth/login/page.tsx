"use client";

import { Suspense, useEffect, useState, useRef } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthModal } from "./AuthModal";
import { useRouter, useSearchParams } from "next/navigation";
import { getUserRole } from "@/lib/utils/auth-helpers";
import { getOptionalAuthUser } from "@/lib/utils/auth-session-check";

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
  }, []);

  const handleClose = () => {
    if (from) {
      router.push("/");
    } else {
      router.back();
    }
  };

  if (isChecking) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>
          Entrez vos identifiants pour accéder à votre compte
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AuthModal open={true} onClose={handleClose} embedded={true} />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Connexion</CardTitle>
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
      <LoginContent />
    </Suspense>
  );
}
