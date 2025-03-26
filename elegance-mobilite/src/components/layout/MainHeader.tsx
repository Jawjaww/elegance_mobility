"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  User as UserIcon,
  Settings,
  Home,
  Menu,
  X,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  extractDisplayName,
  getInitialsFromName,
} from "@/lib/utils/user-utils";

export function MainHeader() {
  const { isAuthenticated, user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // On utilise directement les données de l'utilisateur sans faire d'appel API
  const displayName = user
    ? extractDisplayName(user.email || "", user.user_metadata)
    : "";
  const userEmail = user?.email || "";
  const userInitials = getInitialsFromName(displayName);

  // Fermer le menu mobile lors du changement de page
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Navigation principale
  const navItems = [
    { name: "Accueil", href: "/", icon: Home },
    { name: "Services", href: "/services" },
    { name: "Réserver", href: "/reservation" },
    { name: "À propos", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-neutral-900 shadow-lg">
      <div className="container flex h-16 items-center px-4 sm:px-6">
        <div className="mr-4 flex">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-300 bg-clip-text text-transparent">
              Vector Elegans
            </span>
          </Link>
        </div>

        {/* Menu pour ordinateur */}
        <nav className="hidden md:flex md:flex-1 md:items-center md:justify-between">
          <ul className="flex space-x-6">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "text-sm transition-colors hover:text-blue-400",
                    pathname === item.href
                      ? "text-blue-500 font-medium"
                      : "text-neutral-300"
                  )}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
          <div>
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar className="h-10 w-10 border-2 border-neutral-800 bg-neutral-900">
                      <AvatarFallback className="bg-blue-900/40 text-blue-200">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-neutral-900 border-neutral-800"
                  align="end"
                  forceMount
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-neutral-100">
                        {displayName}
                      </p>
                      <p className="text-xs text-neutral-400 truncate">
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-neutral-800" />
                  <DropdownMenuGroup>
                    <Link href="/my-account">
                      <DropdownMenuItem className="text-neutral-200 focus:bg-neutral-800 focus:text-neutral-100 cursor-pointer">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Mon profil</span>
                      </DropdownMenuItem>
                    </Link>
                    <Link href="/my-account/reservations">
                      <DropdownMenuItem className="text-neutral-200 focus:bg-neutral-800 focus:text-neutral-100 cursor-pointer">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Mes réservations</span>
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator className="bg-neutral-800" />
                  <DropdownMenuItem
                    className="text-red-400 focus:bg-red-900/50 focus:text-red-300 cursor-pointer"
                    onSelect={handleSignOut}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth/login">
                <Button
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Connexion
                </Button>
              </Link>
            )}
          </div>
        </nav>

        {/* Bouton menu mobile */}
        <div className="flex-1 flex justify-end md:hidden">
          <Button
            variant="ghost"
            size="icon"
            className="text-neutral-200"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Menu mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-neutral-900/95 backdrop-blur-sm">
          <div className="container py-4 px-4 sm:px-6">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center py-2 text-base transition-colors hover:text-blue-400",
                    pathname === item.href
                      ? "text-blue-500 font-medium"
                      : "text-neutral-300"
                  )}
                >
                  {item.name}
                </Link>
              ))}

              <div className="pt-4 border-t border-neutral-800">
                {isAuthenticated && user ? (
                  <div className="space-y-4">
                    <div className="flex items-center">
                      <Avatar className="h-10 w-10 mr-3 border-2 border-neutral-800 bg-neutral-900">
                        <AvatarFallback className="bg-blue-900/40 text-blue-200">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{displayName}</p>
                        <p className="text-sm text-neutral-400 truncate">
                          {userEmail}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Link href="/my-account">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-neutral-300 hover:text-blue-400 hover:bg-neutral-800"
                        >
                          <UserIcon className="mr-2 h-4 w-4" />
                          Mon profil
                        </Button>
                      </Link>

                      <Link href="/my-account/reservations">
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-neutral-300 hover:text-blue-400 hover:bg-neutral-800"
                        >
                          <Settings className="mr-2 h-4 w-4" />
                          Mes réservations
                        </Button>
                      </Link>

                      <Button
                        variant="ghost"
                        className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-900/30"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Link href="/auth/login">
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Connexion
                    </Button>
                  </Link>
                )}
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
