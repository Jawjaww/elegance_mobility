"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/auth/login/actions";

import {
  Menu,
  X,
  LogOut,
  Calendar,
  Map,
  Clock,
  User,
  Home,
} from "lucide-react";

export function DriverHeader() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);


  return (
    <header className="border-b bg-emerald-800 text-white sticky top-0 z-50">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/driver-portal" className="flex items-center">
          <span className="text-xl font-bold">Portail Chauffeur</span>
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/driver-portal"
            className={
              pathname === "/driver-portal"
                ? "font-semibold text-emerald-300"
                : ""
            }
          >
            Mes courses
          </Link>
          <Link
            href="/driver-portal/schedule"
            className={
              pathname === "/driver-portal/schedule"
                ? "font-semibold text-emerald-300"
                : ""
            }
          >
            Planning
          </Link>
          <Link
            href="/driver-portal/history"
            className={
              pathname === "/driver-portal/history"
                ? "font-semibold text-emerald-300"
                : ""
            }
          >
            Historique
          </Link>
          <Link
            href="/driver-portal/profile"
            className={
              pathname === "/driver-portal/profile"
                ? "font-semibold text-emerald-300"
                : ""
            }
          >
            Mon profil
          </Link>

          <div className="flex items-center ml-4">
            <form action={logout}>
              <Button
                type="submit"
                variant="ghost"
                className="text-white hover:text-gray-300"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Déconnexion</span>
              </Button>
            </form>
            <Button variant="outline" className="ml-4" asChild>
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                <span>Retour au site</span>
              </Link>
            </Button>
          </div>
        </nav>

        {/* Menu mobile */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          type="button"
        >
          {isMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Navigation mobile */}
      {isMenuOpen && (
        <div className="md:hidden px-4 py-2 border-t border-emerald-700">
          <nav className="flex flex-col space-y-4 py-4">
            <Link
              href="/driver-portal"
              className={
                pathname === "/driver-portal"
                  ? "font-semibold text-emerald-300"
                  : ""
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Map className="mr-2 h-5 w-5" />
                <span>Mes courses</span>
              </div>
            </Link>
            <Link
              href="/driver-portal/schedule"
              className={
                pathname === "/driver-portal/schedule"
                  ? "font-semibold text-emerald-300"
                  : ""
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                <span>Planning</span>
              </div>
            </Link>
            <Link
              href="/driver-portal/history"
              className={
                pathname === "/driver-portal/history"
                  ? "font-semibold text-emerald-300"
                  : ""
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                <span>Historique</span>
              </div>
            </Link>
            <Link
              href="/driver-portal/profile"
              className={
                pathname === "/driver-portal/profile"
                  ? "font-semibold text-emerald-300"
                  : ""
              }
              onClick={() => setIsMenuOpen(false)}
            >
              <div className="flex items-center">
                <User className="mr-2 h-5 w-5" />
                <span>Mon profil</span>
              </div>
            </Link>

            <div className="pt-4 border-t border-emerald-700 flex flex-col space-y-4">
              <form action={logout}>
                <button
                  type="submit"
                  className="flex items-center text-red-300"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  <span>Déconnexion</span>
                </button>
              </form>
              <Link
                href="/"
                className="flex items-center"
                onClick={() => setIsMenuOpen(false)}
              >
                <Home className="mr-2 h-5 w-5" />
                <span>Retour au site</span>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
