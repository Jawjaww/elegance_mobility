'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Calendar, Home, User } from "lucide-react";
import { AuthUser } from "@/lib/types/auth.types";
import { cn } from "@/lib/utils";

interface ClientMobileNavProps {
  user: AuthUser | null;
}

export default function ClientMobileNav({ user }: ClientMobileNavProps) {
  const pathname = usePathname() || '';

  if (!user) return null;

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-neutral-900/70 backdrop-blur-md z-[1000]">
      <div className="h-20 px-6 flex justify-evenly items-center">
        {/* Home Link */}
        <Link
          href="/"
          className={cn(
            "flex flex-col items-center transition-transform duration-300 ease-in-out",
            isActive("/")
              ? "text-blue-400 scale-110"
              : "text-neutral-300 hover:text-neutral-100 hover:scale-105"
          )}
        >
          <Home className="h-8 w-8" />
          <span className="text-sm mt-1 font-medium">Accueil</span>
        </Link>

        {/* Reservation Link */}
        <Link
          href="/reservation"
          className={cn(
            "flex flex-col items-center transition-transform duration-300 ease-in-out",
            isActive("/reservation")
              ? "text-blue-400 scale-110"
              : "text-neutral-300 hover:text-neutral-100 hover:scale-105"
          )}
        >
          <Car className="h-8 w-8" />
          <span className="text-sm mt-1 font-medium">Réserver</span>
        </Link>

        {/* My Reservations Link */}
        <Link
          href="/my-account/reservations"
          className={cn(
            "flex flex-col items-center transition-transform duration-300 ease-in-out",
            isActive("/my-account/reservations")
              ? "text-blue-400 scale-110"
              : "text-neutral-300 hover:text-neutral-100 hover:scale-105"
          )}
        >
          <Calendar className="h-8 w-8" />
          <span className="text-sm mt-1 font-medium">Mes réservations</span>
        </Link>

        {/* My Account Link */}
        <Link
          href="/my-account"
          className={cn(
            "flex flex-col items-center transition-transform duration-300 ease-in-out",
            isActive("/my-account")
              ? "text-blue-400 scale-110"
              : "text-neutral-300 hover:text-neutral-100 hover:scale-105"
          )}
        >
          <User className="h-8 w-8" />
          <span className="text-sm mt-1 font-medium">Compte</span>
        </Link>
      </div>
    </nav>
  );
}
