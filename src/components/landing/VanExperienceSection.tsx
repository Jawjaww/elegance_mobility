"use client";

import { Plane, PartyPopper, Users, Sofa } from "lucide-react";
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
    text: "Toute l’équipe dans un seul véhicule.",
  },
  {
    icon: PartyPopper,
    title: "Événement",
    text: "Mariage, séminaire : on tient l’horaire.",
  },
  {
    icon: Users,
    title: "Famille",
    text: "Valises, poussette — de la place.",
  },
  {
    icon: Sofa,
    title: "Salon",
    text: "Face à face. La route devient un moment.",
  },
] as const;

function VanHeading() {
  return (
    <>
      <p className="text-[11px] md:text-xs font-medium uppercase tracking-[0.2em] text-sky-400 mb-1 md:mb-3">
        Groupe
      </p>
      <h2 className="text-2xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
        Van de confort
      </h2>
      <p className="mt-1.5 md:mt-4 text-sm md:text-lg lg:text-xl text-neutral-300 md:text-neutral-400 max-w-md leading-snug md:leading-relaxed">
        7 sièges, tout le bagage. Le groupe part et arrive ensemble.
      </p>
    </>
  );
}

export function VanExperienceSection() {
  return (
    <section id="van" className={LANDING_PANEL}>
      <div className="flex min-h-0 flex-1 flex-col pt-16 md:grid md:grid-cols-2">
        <div className="order-2 shrink-0 px-4 py-3 md:order-1 md:flex md:min-h-0 md:flex-1 md:flex-col md:justify-center md:px-10 md:py-8 lg:px-14">
          <FadeIn from="left" distance={40} className="hidden md:block">
            <VanHeading />
          </FadeIn>
          <StaggerContainer
            stagger={0.08}
            className="grid grid-cols-2 gap-2.5 md:mt-8 md:gap-6 lg:gap-8"
          >
            {SITUATIONS.map((item, index) => (
              <StaggerItem
                key={item.title}
                from={index % 2 === 0 ? "right" : "left"}
                distance={28}
              >
                <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2.5 md:gap-x-4 items-center">
                  <div className="shrink-0 w-8 h-8 md:w-11 md:h-11 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
                    <item.icon
                      className="h-3.5 w-3.5 md:h-5 md:w-5 text-sky-400"
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
        <div className="order-1 flex min-h-0 flex-1 flex-col md:order-2 md:h-full">
          <ExperienceMediaStage
            video={LANDING_ASSETS.vanVideo}
            poster={LANDING_ASSETS.vanPoster}
            overlay="from-sky-950/70"
          >
            <VanHeading />
          </ExperienceMediaStage>
        </div>
      </div>
    </section>
  );
}
