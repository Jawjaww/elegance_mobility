"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AdminLoginForm } from "./AdminLoginForm";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/database/client";
import { isUserAdmin } from "@/lib/utils/auth-helpers";
import { resolveBackofficePostLoginPath } from "@/lib/auth/backoffice-auth";

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
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
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
              Retour à l&apos;accueil
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
      }
    >
      <AdminLoginPageContent />
    </Suspense>
  );
}
