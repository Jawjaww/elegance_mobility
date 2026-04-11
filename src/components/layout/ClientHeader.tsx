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
import { Car, History, User2, LogOut } from "lucide-react";
import { supabase } from "@/lib/database/client";

const NAV_ITEMS = [
  {
    name: "Réserver",
    href: "/reservation",
    icon: Car,
  },
  {
    name: "Mes réservations",
    href: "/my-account/reservations",
    icon: History,
  },
  {
    name: "Mon compte",
    href: "/my-account",
    icon: User2,
  },
];

export function ClientHeader() {
  const pathname = usePathname() ?? "";
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserEmail(user.email || null);
      }
    });
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      window.location.href = "/auth/login";
    } catch (error) {
      console.error("Erreur lors de la déconnexion:", error);
      setIsLoggingOut(false);
    }
  };

  const getAvatarFallback = () => {
    return userEmail?.[0].toUpperCase() ?? "C";
  };

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(`${path}/`);

  useEffect(() => {
    console.debug(
      "[ClientHeader] mounted. headers in DOM:",
      document.querySelectorAll("[data-header]").length,
    );
    return () => console.debug("[ClientHeader] unmounted");
  }, []);

  return (
    <header
      data-header="client"
      className="sticky top-0 z-50 w-full border-b border-neutral-700/30"
    >
      <div className="bg-gradient-to-r from-neutral-950/85 to-neutral-900/90 backdrop-blur-sm">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
          {/* Logo à gauche */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="btn-gradient bg-clip-text text-transparent font-bold text-xl">
                Vector Elegans
              </span>
            </Link>
          </div>

          {/* Navigation au centre - Desktop uniquement */}
          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center space-x-2 transition-all duration-200 hover:text-blue-400",
                  isActive(item.href) ? "text-blue-400" : "text-neutral-400",
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-full transition-all duration-200",
                    isActive(item.href)
                      ? "bg-blue-500/15 shadow-[0_0_8px_-2px_rgba(37,99,235,0.2)]"
                      : "group-hover:bg-neutral-800/30",
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-4 w-4",
                      isActive(item.href)
                        ? "text-blue-400"
                        : "text-neutral-400",
                    )}
                  />
                </div>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>

          {/* Avatar à droite avec espacement */}
          <div className="flex items-center pr-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-9 w-9 rounded-full"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage
                      src="/avatars/client.png"
                      alt="Avatar"
                      onError={(e) => {
                        e.currentTarget.src = "/avatars/default-avatar.png";
                      }}
                    />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getAvatarFallback()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[200px] p-2">
                <DropdownMenuItem asChild>
                  <Link href="/my-account" className="flex items-center gap-2">
                    <User2 className="h-4 w-4" />
                    <span>Mon compte</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2 text-red-500"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{isLoggingOut ? "Déconnexion..." : "Déconnexion"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
