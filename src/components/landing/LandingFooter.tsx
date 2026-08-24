import Link from "next/link";

export function LandingFooter() {
  return (
    <footer className="border-t border-blue-500/10 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
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
            className="text-blue-400 hover:text-blue-300 transition-colors"
          >
            Réserver
          </Link>
        </div>
      </div>
    </footer>
  );
}
