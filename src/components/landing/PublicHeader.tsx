"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PublicAuthActions } from "@/components/landing/PublicAuthActions";
import { LANDING_BRAND, LANDING_CTA } from "@/components/landing/landingAssets";
import { LANDING_PAGE_X } from "@/components/landing/landingSurface";
import { cn } from "@/lib/utils";

export function PublicHeader() {
  const pathname = usePathname() ?? "";
  const isLogin = pathname.startsWith("/auth/login");
  const isReservationFlow = pathname.startsWith("/reservation");

  return (
    <header className="sticky top-0 z-50 border-b border-blue-500/15 bg-neutral-950/85 backdrop-blur-xl pt-[env(safe-area-inset-top,0px)]">
      <div
        className={cn(
          "mx-auto flex h-16 max-w-7xl items-center justify-between gap-4",
          LANDING_PAGE_X,
        )}
      >
        <Link href="/" className={LANDING_BRAND}>
          Vector&nbsp;Elegans
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/contact"
            className="hidden text-sm text-neutral-300 transition-colors hover:text-white sm:inline"
          >
            Contact
          </Link>
          <PublicAuthActions hideLoginLink={isLogin} />
          {!isReservationFlow ? (
            <Button asChild size="sm" className={LANDING_CTA}>
              <Link href="/reservation">Réserver</Link>
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
