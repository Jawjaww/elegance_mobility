"use client";

import Link from "next/link";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OperatorAuthGuard } from "@/components/auth/OperatorAuthGuard";
import { supabase } from "@/lib/database/client";
import { LANDING_BRAND } from "@/components/landing/landingAssets";

/**
 * En-tête du portail opérateur : marque, portée, déconnexion.
 *
 * Pas de navigation : le portail n'a qu'un écran (OP-07 portera la flotte).
 * L'accent est violet, là où l'administration est bleue — deux portées
 * distinctes ne doivent pas se ressembler.
 */
function OperatorHeader() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      globalThis.location.href = "/auth/login";
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setIsLoggingOut(false);
    }
  };

  return (
    <header
      data-header="operator"
      className="sticky top-0 z-50 w-full border-b border-neutral-700/30"
    >
      <div className="bg-gradient-to-r from-neutral-950/95 to-neutral-900/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href="/operator-portal" className="flex shrink-0 items-baseline gap-2">
            <span className={LANDING_BRAND}>Vector&nbsp;Elegans</span>
            <span className="hidden text-sm font-medium text-violet-300/90 lg:inline">
              Opérateur
            </span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="ml-auto shrink-0 text-neutral-400 hover:text-neutral-100"
          >
            <LogOut className="mr-2 h-4 w-4" aria-hidden />
            <span>{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Portail opérateur : toutes les routes sont derrière OperatorAuthGuard.
 *
 * Il n'y a pas de route publique ici (pas de page de connexion dédiée), donc
 * pas de branche « pathname === login » comme dans le backoffice.
 */
export default function OperatorPortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <OperatorAuthGuard>
      <div className="min-h-screen bg-neutral-950 text-white">
        <OperatorHeader />
        <main className="mx-auto max-w-screen-2xl px-4 py-8 sm:px-6 lg:px-8 mobile-safe-area">
          {children}
        </main>
      </div>
    </OperatorAuthGuard>
  );
}
