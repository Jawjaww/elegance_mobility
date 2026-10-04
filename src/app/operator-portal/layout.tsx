"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OperatorAuthGuard } from "@/components/auth/OperatorAuthGuard";
import { supabase } from "@/lib/database/client";
import { LANDING_BRAND } from "@/components/landing/landingAssets";

/**
 * Sections du portail. L'accent est violet, là où l'administration est bleue — deux portées
 * distinctes ne doivent pas se ressembler.
 */
const OPERATOR_NAV = [
  { href: "/operator-portal", label: "Tableau de bord" },
  { href: "/operator-portal/rides", label: "Courses" },
  { href: "/operator-portal/drivers", label: "Chauffeurs" },
  { href: "/operator-portal/vehicles", label: "Véhicules" },
  { href: "/operator-portal/rates", label: "Tarifs" },
] as const;

/**
 * Une seule entrée active à la fois. `/operator-portal` est préfixe de toutes les autres : sans
 * la comparaison exacte pour l'accueil, l'onglet « Tableau de bord » resterait allumé partout —
 * le défaut qui avait déjà coûté une passe de correction sur la navigation cliente.
 */
function isActiveSection(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/operator-portal") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function OperatorHeader() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pathname = usePathname();

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

      <nav
        aria-label="Sections du portail opérateur"
        className="border-t border-neutral-800/60 bg-neutral-950/80"
      >
        <ul className="mx-auto flex max-w-screen-2xl gap-1 overflow-x-auto px-4 sm:px-6 lg:px-8">
          {OPERATOR_NAV.map((item) => {
            const active = isActiveSection(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`inline-block whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors ${
                    active
                      ? "border-violet-400 text-violet-200"
                      : "border-transparent text-neutral-400 hover:text-neutral-100"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
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
