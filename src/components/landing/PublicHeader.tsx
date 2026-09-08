"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LANDING_CTA } from "@/components/landing/landingAssets";

export function PublicHeader() {
  const pathname = usePathname() ?? "";
  const isLogin = pathname.startsWith("/auth/login");

  return (
    <header className="sticky top-0 z-50 border-b border-blue-500/15 bg-neutral-950/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-white transition-colors hover:text-blue-300"
        >
          Vector Elegans
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            className="hidden text-sm text-neutral-300 transition-colors hover:text-white sm:inline"
          >
            Contact
          </Link>
          {!isLogin ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-neutral-300 hover:bg-white/10 hover:text-white"
            >
              <Link href="/auth/login">Connexion</Link>
            </Button>
          ) : null}
          <Button asChild size="sm" className={LANDING_CTA}>
            <Link href="/reservation">Réserver</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
