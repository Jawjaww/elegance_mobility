"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminLoginForm } from "./AdminLoginForm";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/database/client";
import { getUserRole } from "@/lib/utils/auth-helpers";

export default function AdminLoginPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    // Éviter les redirections multiples
    if (hasRedirected.current) return;

    const checkSession = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (user && !hasRedirected.current) {
          hasRedirected.current = true;

          // Vérifier si c'est un admin pour rediriger directement
          const role = getUserRole(user);
          if (role === "app_admin" || role === "app_super_admin") {
            router.replace("/backoffice-portal/dashboard");
          } else {
            // Pas un admin - rediriger vers son portail correspondant
            if (role === "app_driver")
              router.replace("/driver-portal/dashboard");
            else router.replace("/my-account");
          }
          return;
        }
      } catch (error) {
        console.error("Erreur vérification session:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Pas de dépendances pour éviter les boucles

  if (isChecking) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center py-8">
      <Card className="w-full max-w-[425px]">
        <CardHeader>
          <CardTitle className="text-center text-white">
            Connexion Administrateur
          </CardTitle>
          <CardDescription className="text-center text-neutral-300">
            Accès réservé aux administrateurs et super administrateurs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AdminLoginForm />

          <div className="text-center">
            <Link
              href="/"
              className="text-sm text-neutral-400 hover:text-white"
            >
              Retour à l'accueil
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
