"use client";

import { Plane, Briefcase, Moon, Building2 } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/StaggerContainer";
import { LANDING_ASSETS } from "@/components/landing/landingAssets";
import { LANDING_PANEL } from "@/components/landing/landingPanel";
import { ExperienceMediaStage } from "@/components/landing/VehicleExperienceMedia";

const SITUATIONS = [
  {
    icon: Plane,
    title: "Aéroport",
    text: "Solo ou duo, bagages chargés. Terminal à l’heure.",
  },
  {
    icon: Briefcase,
    title: "Business",
    text: "De l’hôtel au QG, vous arrivez net.",
  },
  {
    icon: Moon,
    title: "Soirée",
    text: "Restaurant, gala : elle vous attend à la sortie.",
  },
  {
    icon: Building2,
    title: "Ville à ville",
    text: "Un salon mobile entre deux adresses.",
  },
] as const;

function BerlineHeading() {
  return (
    <>
      <p className="text-[11px] md:text-xs font-medium uppercase tracking-[0.2em] text-blue-400 mb-1 md:mb-3">
        Executive
      </p>
      <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
        Berline premium
      </h2>
      <p className="mt-1.5 md:mt-4 text-sm md:text-lg lg:text-xl text-neutral-300 md:text-neutral-400 max-w-md leading-snug md:leading-relaxed">
        Jusqu’à 4 passagers, 3 bagages. L’allure, et l’heure d’arrivée.
      </p>
    </>
  );
}

export function BerlineExperienceSection() {
  return (
    <section id="berline" className={LANDING_PANEL}>
      <div className="flex min-h-0 flex-1 flex-col pt-16 md:grid md:grid-cols-2">
        <ExperienceMediaStage
          video={LANDING_ASSETS.berlineVideo}
          poster={LANDING_ASSETS.berlinePoster}
          overlay="from-blue-950/70"
          pingPong
        >
          <BerlineHeading />
        </ExperienceMediaStage>
        <div className="shrink-0 px-4 py-3 md:flex md:min-h-0 md:flex-1 md:flex-col md:justify-center md:px-10 md:py-8 lg:px-14">
          <FadeIn from="right" distance={40} className="hidden md:block">
            <BerlineHeading />
          </FadeIn>
          <StaggerContainer
            stagger={0.08}
            className="grid grid-cols-2 gap-2.5 md:mt-8 md:gap-6 lg:gap-8"
          >
            {SITUATIONS.map((item, index) => (
              <StaggerItem
                key={item.title}
                from={index % 2 === 0 ? "left" : "right"}
                distance={28}
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 md:gap-x-4 items-center">
                  <div className="shrink-0 w-8 h-8 md:w-11 md:h-11 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                    <item.icon
                      className="h-3.5 w-3.5 md:h-5 md:w-5 text-blue-400"
                      aria-hidden
                    />
                  </div>
                  <h3 className="text-sm md:text-lg font-semibold text-white">
                    {item.title}
                  </h3>
                  <p className="col-start-2 mt-0.5 md:mt-1 text-xs md:text-base text-neutral-400 leading-snug md:leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </div>
    </section>
  );
}
