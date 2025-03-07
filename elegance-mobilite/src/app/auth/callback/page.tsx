"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { supabase } from "@/utils/supabase/client";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Fonction pour gérer le processus d'authentification et la redirection
    async function handleAuthCallback() {
      const errorCode = searchParams?.get("error_code");
      const errorDescription = searchParams?.get("error_description");
      
      try {
        // Si un hash existe dans l'URL (comme après confirmation d'email)
        if (window.location.hash) {
          // Si nous avons une erreur
          if (errorCode) {
            console.error("Erreur d'authentification:", errorCode, errorDescription);
            
            // Si le lien a expiré, rediriger vers la page de connexion avec message
            if (errorCode === "otp_expired") {
              router.push('/login?error=expired_link');
              return;
            }
            
            // Pour d'autres erreurs, rediriger vers la page d'accueil
            router.push('/');
            return;
          }
          
          // Tenter de récupérer la session active
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            throw error;
          }
          
          // Rediriger l'utilisateur selon son état d'authentification
          if (session) {
            // Vérifier s'il y avait une redirection en attente dans localStorage
            const redirectTo = localStorage.getItem('authRedirectTo');
            if (redirectTo) {
              localStorage.removeItem('authRedirectTo'); // Nettoyer
              router.push(redirectTo);
            } else {
              // Sinon, rediriger vers la page d'accueil
              router.push('/');
            }
          } else {
            // Si nous n'avons pas de session, rediriger vers la page de connexion
            router.push('/login?error=session_error');
          }
        } else {
          // S'il n'y a pas de hash, rediriger vers la page d'accueil
          router.push('/');
        }
      } catch (error) {
        console.error("Erreur lors du traitement du callback:", error);
        router.push('/login?error=auth_error');
      }
    }
    
    handleAuthCallback();
  }, [router, searchParams]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-950 p-4">
      <div className="text-center space-y-4">
        <LoadingSpinner size="lg" className="mx-auto" />
        <h1 className="text-xl font-medium text-white">Traitement de l'authentification...</h1>
        <p className="text-neutral-400">Vous allez être redirigé dans un instant</p>
      </div>
    </div>
  );
}
