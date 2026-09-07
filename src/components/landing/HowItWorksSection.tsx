"use client";

import { Calculator, CalendarCheck, MapPin } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/StaggerContainer";
import { LANDING_PANEL } from "@/components/landing/landingPanel";

const STEPS = [
  {
    icon: Calculator,
    title: "Simulez",
    description: "Départ, arrivée : le prix s’affiche tout de suite.",
  },
  {
    icon: CalendarCheck,
    title: "Réservez",
    description: "Vous confirmez. On bloque l’horaire du chauffeur.",
  },
  {
    icon: MapPin,
    title: "Partez",
    description: "Ses coordonnées avant le départ. Ponctuel, c’est garanti.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section id="comment-ca-marche" className={LANDING_PANEL}>
      <div className="flex min-h-0 flex-1 flex-col justify-center px-4 sm:px-6 lg:px-8 pt-16 pb-4 md:pb-8">
        <div className="max-w-7xl mx-auto w-full">
          <FadeIn from="left" className="text-center mb-5 md:mb-12 lg:mb-16">
            <p className="text-[11px] md:text-sm font-medium uppercase tracking-wider text-blue-400 mb-1.5 md:mb-3">
              Trois gestes
            </p>
            <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white">
              Comment ça marche ?
            </h2>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-2.5 md:gap-8 lg:gap-12">
            {STEPS.map((step, index) => (
              <StaggerItem
                key={step.title}
                from={index % 2 === 0 ? "left" : "right"}
              >
                <article className="group h-full rounded-xl md:rounded-2xl border border-white/10 bg-gradient-to-br from-blue-500/[0.06] to-transparent backdrop-blur-sm p-3 md:p-8 lg:p-10 flex items-center gap-3 md:flex-col md:items-center md:text-center md:justify-center md:min-h-[15rem] lg:min-h-[17rem] hover:border-blue-500/40 hover:shadow-lg hover:shadow-blue-950/40 transition-all duration-300">
                  <div className="flex flex-col items-center shrink-0 md:mb-2">
                    <span className="hidden md:block text-sm font-bold text-blue-400/80 tabular-nums mb-3">
                      0{index + 1}
                    </span>
                    <div className="w-9 h-9 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-lg md:rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center group-hover:bg-blue-500/20 transition-colors">
                      <step.icon
                        className="h-4 w-4 md:h-6 md:w-6 lg:h-7 lg:w-7 text-blue-400"
                        aria-hidden
                      />
                    </div>
                  </div>
                  <div className="min-w-0 md:max-w-xs lg:max-w-sm">
                    <h3 className="text-base md:text-2xl lg:text-3xl font-semibold text-white md:mb-4">
                      {step.title}
                    </h3>
                    <p className="text-neutral-400 text-xs md:text-lg lg:text-xl leading-snug md:leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </article>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
