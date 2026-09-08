import Link from "next/link";
import { PublicPageShell } from "@/components/landing/PublicPageShell";
import {
  LANDING_CTA,
  LANDING_KICKER,
  LANDING_PAGE_MAIN,
} from "@/components/landing/landingSurface";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function Contact() {
  return (
    <PublicPageShell>
      <main className={cn("mx-auto w-full max-w-xl", LANDING_PAGE_MAIN)}>
        <p className={`${LANDING_KICKER} mb-3`}>Contact</p>
        <h1 className="text-3xl font-bold text-white md:text-4xl">
          Contactez-nous
        </h1>
        <p className="mt-3 text-neutral-400">
          Une question sur une course, un devis, un partenariat chauffeur ?
          Écrivez-nous — nous revenons vers vous rapidement.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild className={LANDING_CTA}>
            <Link href="/reservation">Réserver une course</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="border-blue-400/30 text-white hover:bg-blue-500/15"
          >
            <a href="mailto:contact@vector-elegans.fr">Envoyer un email</a>
          </Button>
        </div>
      </main>
    </PublicPageShell>
  );
}
