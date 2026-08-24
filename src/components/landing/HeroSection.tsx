"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import {
  LANDING_ASSETS,
  LANDING_CTA,
} from "@/components/landing/landingAssets";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section className="relative min-h-[100svh] flex items-end sm:items-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        {reducedMotion ? (
          <Image
            src={LANDING_ASSETS.heroPoster}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.08 }}
            animate={{ scale: 1 }}
            transition={{ duration: 14, ease: "linear" }}
          >
            <video
              autoPlay
              muted
              loop
              playsInline
              poster={LANDING_ASSETS.heroPoster}
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src={LANDING_ASSETS.heroVideo} type="video/mp4" />
            </video>
          </motion.div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-950/80 via-neutral-950/45 to-neutral-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/70 via-transparent to-neutral-950/50" />
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 20% 70%, rgba(37,99,235,0.35), transparent 60%)",
          }}
        />
      </div>

      <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12 sm:py-20">
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
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight"
          >
            Réservez votre VTC
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
            Simulez votre trajet et bloquez votre course en toute sérénité.
          </motion.p>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18, ease }}
            className="mt-7 flex flex-col sm:flex-row gap-3"
          >
            <Button
              asChild
              size="lg"
              className={`h-12 px-8 text-base ${LANDING_CTA}`}
            >
              <Link href="/reservation">
                Réserver ma course
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-8 border-blue-400/30 bg-blue-500/5 text-white hover:bg-blue-500/15 hover:text-white text-base backdrop-blur-sm"
            >
              <Link href="/reservation">Simuler un prix</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
