"use client";

import { Calculator, CalendarCheck, MapPin } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/StaggerContainer";

const STEPS = [
  {
    icon: Calculator,
    title: "Simulez le prix",
    description:
      "Saisissez les adresses de départ et d'arrivée pour obtenir un devis instantané.",
  },
  {
    icon: CalendarCheck,
    title: "Commandez",
    description:
      "Entrez vos informations et confirmez la réservation. Nous bloquons l'horaire de votre chauffeur.",
  },
  {
    icon: MapPin,
    title: "Réservation garantie",
    description:
      "Votre chauffeur est confirmé. Vous recevrez ses coordonnées avant le départ.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="comment-ca-marche"
      className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-7xl mx-auto">
        <FadeIn className="text-center mb-8 sm:mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-blue-400 mb-3">
            Simple et rapide
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Comment ça marche ?
          </h2>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {STEPS.map((step, index) => (
            <StaggerItem key={step.title}>
              <article className="group h-full rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/[0.06] to-transparent backdrop-blur-sm p-6 sm:p-8 hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-950/40 transition-all duration-300">
                <div className="flex items-center gap-3 mb-5">
                  <span className="text-xs font-bold text-blue-400/80 tabular-nums">
                    0{index + 1}
                  </span>
                  <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                    <step.icon
                      className="h-5 w-5 text-blue-400"
                      aria-hidden
                    />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-neutral-400 text-sm leading-relaxed">
                  {step.description}
                </p>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
