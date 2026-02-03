"use client";

import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthModal } from "./AuthModal";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/database/client";

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
        const {
          data: { session },
        } = await supabase.auth.getSession();
        
        if (session?.user && !hasRedirected.current) {
          hasRedirected.current = true;
          router.replace('/auth/already-connected?redirect=login');
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Card>
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
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>Chargement...</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
