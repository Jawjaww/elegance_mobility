"use client";

import { useAuth } from "@/lib/auth/useAuth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { User, Car, Settings } from "lucide-react";
import Link from "next/link";

interface MyAccountLayoutProps {
  children: React.ReactNode;
}

export default function MyAccountLayout({ children }: MyAccountLayoutProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  // Rediriger vers la page de connexion si l'utilisateur n'est pas authentifié
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login?redirectTo=/my-account/reservations");
    }
  }, [isAuthenticated, isLoading, router]);

  // Afficher un écran de chargement pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-neutral-400">Chargement de votre espace...</p>
      </div>
    );
  }

  // Si l'utilisateur n'est pas authentifié, ne rien afficher (la redirection se fera)
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mon espace personnel</h1>
        <p className="text-neutral-400">Gérez vos informations et réservations</p>
      </div>
      
      {/* Navigation entre les sections du compte */}
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 flex-shrink-0">
          <nav className="bg-neutral-900 rounded-xl p-4 shadow-md">
            <Link 
              href="/my-account" 
              className="flex items-center px-4 py-2.5 text-white rounded-md hover:bg-neutral-800 transition-colors"
            >
              <User className="h-5 w-5 mr-3 text-neutral-400" />
              Mon profil
            </Link>
            <Link 
              href="/my-account/reservations" 
              className="flex items-center px-4 py-2.5 text-blue-500 bg-blue-900/20 rounded-md mt-2"
            >
              <Car className="h-5 w-5 mr-3 text-blue-400" />
              Mes réservations
            </Link>
            <Link 
              href="/my-account/settings" 
              className="flex items-center px-4 py-2.5 text-white rounded-md hover:bg-neutral-800 transition-colors mt-2"
            >
              <Settings className="h-5 w-5 mr-3 text-neutral-400" />
              Paramètres
            </Link>
          </nav>
        </div>
        
        <div className="flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
