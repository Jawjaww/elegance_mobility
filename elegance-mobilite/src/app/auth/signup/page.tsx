"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import CustomerSignup from "@/components/auth/CustomerSignup";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/database/client";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams?.get("redirectTo");
  const [isChecking, setIsChecking] = useState(true);
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (hasRedirected.current) return;
    
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user && !hasRedirected.current) {
          hasRedirected.current = true;
          router.replace('/auth/already-connected?redirect=signup');
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
            <CardTitle>Créer un compte</CardTitle>
            <CardDescription>
              Inscrivez-vous pour accéder à nos services
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomerSignup />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Créer un compte</CardTitle>
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
      <SignupContent />
    </Suspense>
  );
}
