"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserMenu } from "@/components/layout/UserMenu";
import { AuthUser } from "@/lib/types/auth.types"; // Utiliser le type harmonisé

// Interface pour les props, incluant l'utilisateur optionnel
interface ClientHeaderProps {
  user: AuthUser | null;
}

const navItems = [
  { name: "Réservation", href: "/reservation" },
  { name: "Mes réservations", href: "/my-account/reservations" },
  { name: "Mon compte", href: "/my-account" },
];

// Accepter user comme prop
export function ClientHeader({ user }: ClientHeaderProps) {
  const pathname = usePathname();

  // Pas besoin de useState ou useEffect ici, user vient des props

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/"
          className="ml-4 relative group py-1 inline-flex items-center justify-center text-lg font-semibold h-8 px-4 bg-gradient-to-r from-gray-700 to-gray-900 rounded-md shadow-md border border-neutral-700 transition-all duration-300 ease-out hover:border-blue-400/50"
        >
          <span className="text-white font-montserrat font-bold uppercase">
            Vector Elegans
          </span>
          <div className="absolute inset-0 rounded-md bg-gradient-to-r from-blue-400/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </Link>
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "transition-colors hover:text-foreground/80",
                pathname === item.href
                  ? "text-foreground"
                  : "text-foreground/60"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
        <div className="flex items-center pr-4">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
