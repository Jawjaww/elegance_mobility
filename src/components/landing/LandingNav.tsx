"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LANDING_CTA } from "@/components/landing/landingAssets";

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-neutral-950/85 backdrop-blur-xl border-b border-blue-500/15 shadow-lg shadow-blue-950/20"
          : "bg-transparent",
      )}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white hover:text-blue-300 transition-colors"
        >
          Vector Elegans
        </Link>

        <nav className="hidden sm:flex items-center gap-6 text-sm text-neutral-300">
          <a
            href="#comment-ca-marche"
            className="hover:text-white transition-colors"
          >
            Comment ça marche
          </a>
          <a href="#vehicules" className="hover:text-white transition-colors">
            Véhicules
          </a>
          <Link href="/contact" className="hover:text-white transition-colors">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="text-neutral-300 hover:text-white hover:bg-white/10"
          >
            <Link href="/auth/login">Connexion</Link>
          </Button>
          <Button asChild size="sm" className={LANDING_CTA}>
            <Link href="/reservation">Réserver</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
