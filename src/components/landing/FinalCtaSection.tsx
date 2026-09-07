"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/FadeIn";
import { LANDING_CTA } from "@/components/landing/landingAssets";

export function FinalCtaSection() {
  return (
    <div className="flex min-h-0 flex-1 flex-col justify-center px-4 sm:px-6 lg:px-8 pt-16 pb-6">
      <FadeIn from="left" distance={56} className="max-w-5xl mx-auto w-full">
        <div className="relative overflow-hidden rounded-3xl border border-blue-500/25 bg-gradient-to-br from-blue-950/90 via-neutral-900 to-neutral-950 px-6 py-12 sm:px-12 sm:py-16 lg:py-20 text-center">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            aria-hidden
            style={{
              background:
                "radial-gradient(circle at 30% 20%, rgba(37,99,235,0.35), transparent 55%)",
            }}
          />
          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Prêt à réserver votre prochain trajet ?
            </h2>
            <p className="text-neutral-400 text-base sm:text-lg max-w-xl mx-auto mb-8">
              Rejoignez des centaines de clients qui nous font confiance pour
              leurs déplacements premium.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild size="lg" className={`h-12 px-8 ${LANDING_CTA}`}>
                <Link href="/reservation">
                  Réserver maintenant
                  <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="h-12 px-8 border-blue-400/30 text-white hover:bg-blue-500/15"
              >
                <Link href="/auth/signup/driver">Devenir chauffeur</Link>
              </Button>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
