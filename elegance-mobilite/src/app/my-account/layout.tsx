"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/useAuth";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { User, Settings, Calendar, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks";

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  const { isAuthenticated, isLoading, user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isMobile = useMediaQuery("(max-width: 768px)");
  
  // Garder une trace des tentatives de vérification pour éviter des redirections multiples
  const [redirectAttempted, setRedirectAttempted] = useState(false);

  // Amélioration de la gestion de l'authentification pour éviter les redirections inutiles
  useEffect(() => {
    // Ne rediriger que si l'utilisateur n'est définitivement pas authentifié
    // et que le chargement est terminé ET qu'on n'a pas déjà tenté de rediriger
    if (!isLoading && !isAuthenticated && !user && !redirectAttempted) {
      console.log("Tentative de redirection vers login");
      setRedirectAttempted(true);
      
      // Ajouter un petit délai avant la redirection pour éviter les redirections trop rapides
      const redirectTimeout = setTimeout(() => {
        // Vérifier encore une fois avant de rediriger
        if (!isAuthenticated && !user) {
          console.log("Redirection vers login confirmée");
          router.push("/login");
        }
      }, 500);
      
      return () => clearTimeout(redirectTimeout);
    }
  }, [isLoading, isAuthenticated, user, router, redirectAttempted]);

  // Si en cours de chargement, afficher un état de chargement attrayant
  if (isLoading) {
    return (
      <div className="container py-12 max-w-6xl px-4 md:px-6 flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-6 text-neutral-300 font-medium">Chargement de votre profil...</p>
        </div>
      </div>
    );
  }

  // Si non authentifié mais encore en processus de vérification, afficher un indicateur subtil
  if (!isAuthenticated && !isLoading) {
    // Ne pas retourner null immédiatement pour éviter le flash
    return (
      <div className="container py-8 max-w-6xl px-4 md:px-6 min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse rounded-full h-10 w-10 bg-blue-500/20 mx-auto flex items-center justify-center">
            <span className="sr-only">Vérification de votre compte...</span>
          </div>
        </div>
      </div>
    );
  }

  const menuItems = [
    {
      name: "Mon profil",
      href: "/my-account",
      icon: User,
      exact: true,
    },
    {
      name: "Mes réservations",
      href: "/my-account/reservations",
      icon: Calendar,
      exact: false,
    },
    {
      name: "Paramètres",
      href: "/my-account/settings",
      icon: Settings,
      exact: false,
    },
  ];

  const isActive = (item: { href: string; exact: boolean }) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname?.startsWith(item.href);
  };

  // Structure modifiée - pour mobile, le menu est affiché en bas
  return (
    <div className="container py-8 max-w-6xl px-4 md:px-6">
      {/* En mode desktop, conserver la mise en page avec sidebar */}
      {!isMobile && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Sidebar de navigation - uniquement pour desktop */}
          <aside className="md:col-span-1">
            <nav className="sticky top-24 space-y-1">
              {menuItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      isActive(item)
                        ? "bg-neutral-800 text-neutral-50"
                        : "hover:bg-neutral-800/50 text-neutral-400"
                    )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                </Link>
              ))}

              <Button
                variant="ghost"
                className="w-full justify-start text-left font-normal text-red-400 hover:text-red-300 hover:bg-red-900/30"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Déconnexion
              </Button>
            </nav>
          </aside>

          {/* Contenu principal */}
          <main className="md:col-span-3">{children}</main>
        </div>
      )}

      {/* En mode mobile, afficher seulement le contenu puis le menu en bas */}
      {isMobile && (
        <div className="flex flex-col">
          {/* Contenu principal d'abord */}
          <main className="mb-8">{children}</main>

          {/* Navigation en bas - uniquement pour mobile */}
          <nav className="space-y-1 mt-10 border-t border-neutral-800 pt-6">
            {menuItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    isActive(item)
                      ? "bg-neutral-800 text-neutral-50"
                      : "hover:bg-neutral-800/50 text-neutral-400"
                  )}
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              </Link>
            ))}

            <Button
              variant="ghost"
              className="w-full justify-start text-left font-normal text-red-400 hover:text-red-300 hover:bg-red-900/30"
              onClick={() => signOut()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </Button>
          </nav>
        </div>
      )}
    </div>
  );
}
