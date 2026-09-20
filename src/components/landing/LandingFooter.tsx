import Link from "next/link";
import { LandingInstallInvite } from "@/components/landing/LandingInstallInvite";

export function LandingFooter() {
  return (
    <footer className="shrink-0 border-t border-blue-500/10 px-4 sm:px-6 lg:px-8 pt-3 pb-4">
      <LandingInstallInvite />
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-neutral-500 pt-3">
        <p>© {new Date().getFullYear()} Vector Elegans</p>
        <div className="flex items-center gap-6">
          <Link
            href="/contact"
            className="hover:text-neutral-300 transition-colors"
          >
            Contact
          </Link>
          <Link
            href="/auth/login"
            className="hover:text-neutral-300 transition-colors"
          >
            Connexion
          </Link>
          <Link
            href="/reservation"
            className="hover:text-neutral-300 transition-colors"
          >
            Réserver
          </Link>
        </div>
      </div>
    </footer>
  );
}
