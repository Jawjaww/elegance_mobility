"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Layout,
  Users,
  Car,
  LogOut,
  CreditCard,
  PackageOpen,
  Truck,
} from "lucide-react";
import { supabase } from "@/lib/database/client";

const NAV_ITEMS = [
  {
    name: "Dashboard",
    href: "/backoffice-portal/dashboard",
    icon: Layout,
  },
  {
    name: "Courses",
    href: "/backoffice-portal/rides",
    icon: Car,
  },
  {
    name: "Chauffeurs",
    href: "/backoffice-portal/drivers",
    icon: Users,
  },
  {
    name: "Véhicules",
    href: "/backoffice-portal/vehicles",
    icon: Truck,
  },
  {
    name: "Tarifs",
    href: "/backoffice-portal/rates",
    icon: CreditCard,
  },
  {
    name: "Options",
    href: "/backoffice-portal/options",
    icon: PackageOpen,
  },
];

export function AdminHeader() {
  const pathname = usePathname() ?? "";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserEmail(user?.email ?? null);
      setIsLoading(false);
    };

    initUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email ?? null);
    });

    return () => {
      try {
        subscription.unsubscribe();
      } catch {
        // ignore unsubscribe errors
      }
    };
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      globalThis.location.href = "/backoffice-portal/login";
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setIsLoggingOut(false);
    }
  };

  const getAvatarFallback = () => {
    return userEmail?.[0].toUpperCase() ?? "?";
  };

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  const brand = (
    <Link
      href="/backoffice-portal/dashboard"
      className="flex shrink-0 items-baseline gap-2"
    >
      <span className="bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-xl font-bold text-transparent">
        Vector Elegans
      </span>
      <span className="hidden text-sm font-medium text-neutral-400 lg:inline">
        Administration
      </span>
    </Link>
  );

  const desktopNav = (
    <nav
      className="hidden min-w-0 flex-1 items-center gap-1 md:flex"
      aria-label="Navigation principale"
    >
      {NAV_ITEMS.map((item) => {
        const active = isActive(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-blue-500/15 text-blue-400"
                : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-100",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 shrink-0",
                active ? "text-blue-400" : "text-neutral-500",
              )}
              aria-hidden
            />
            <span className="truncate">{item.name}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <header
      data-header="admin"
      className="sticky top-0 z-50 w-full border-b border-neutral-700/30"
    >
      <div className="bg-gradient-to-r from-neutral-950/95 to-neutral-900/90 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-screen-2xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          {brand}

          {!userEmail && !isLoading ? null : desktopNav}

          <div className="ml-auto flex shrink-0 items-center">
            {(userEmail || isLoading) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-9 w-9 rounded-full"
                    aria-label="Menu compte"
                  >
                    <Avatar className="h-9 w-9">
                      <AvatarImage
                        src="/avatars/admin.png"
                        alt="Avatar administrateur"
                      />
                      <AvatarFallback className="bg-blue-600 text-white">
                        {getAvatarFallback()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px] p-2">
                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center gap-2 text-red-500"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>
                      {isLoggingOut ? "Déconnexion..." : "Déconnexion"}
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
