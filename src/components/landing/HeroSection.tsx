"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { LandingVideo } from "@/components/landing/LandingVideo";
import {
  LANDING_ASSETS,
  LANDING_CTA,
} from "@/components/landing/landingAssets";
import { LANDING_HERO_BOTTOM_FADE } from "@/components/landing/landingSurface";

const ease = [0.22, 1, 0.36, 1] as const;

/** Full-bleed Cayenne + blue wash for the first snap panel (behind copy and TrustStrip). */
export function HeroBackdrop() {
  return (
    <div className="absolute inset-0 z-0">
      <LandingVideo
        src={LANDING_ASSETS.heroVideo}
        poster={LANDING_ASSETS.heroPoster}
        eager
        priority
        className="absolute inset-0 z-0"
        sizes="100vw"
      />
      {/* Always above poster + video so the blue wash is on the first paint. */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-neutral-950/35 to-neutral-950/45" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/70 via-transparent to-neutral-950/40" />
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 55% at 20% 78%, rgba(37,99,235,0.38), transparent 62%)",
          }}
        />
        <div className={LANDING_HERO_BOTTOM_FADE} />
      </div>
    </div>
  );
}

export function HeroSection() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section className="relative z-10 flex min-h-0 flex-1 flex-col justify-center overflow-hidden pt-20 pb-4">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-0">
        <div className="max-w-3xl">
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease }}
            className="inline-flex items-center gap-2 rounded-full border border-blue-400/30 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-200 mb-5 backdrop-blur-sm"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            VTC premium — vous êtes au bon endroit
          </motion.div>

          <motion.h1
            initial={reducedMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease }}
            className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight"
          >
            <span className="block">Réservez votre VTC</span>
            <span className="block bg-gradient-to-r from-blue-300 via-blue-400 to-sky-300 bg-clip-text text-transparent">
              en quelques clics
            </span>
          </motion.h1>

          <motion.p
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.12, ease }}
            className="mt-4 text-base sm:text-lg text-neutral-300 max-w-xl leading-relaxed"
          >
            Chauffeur confirmé, tarif transparent, prise en charge ponctuelle.
            Le prix s’affiche tout de suite — vous confirmez ensuite.
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18, ease }}
            className="mt-5"
          >
            <Button
              asChild
              size="lg"
              className={`h-12 px-8 text-base ${LANDING_CTA}`}
            >
              <Link href="/reservation">
                Simuler un prix
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
