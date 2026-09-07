"use client";

import { Plane, PartyPopper, Users, Sofa } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/StaggerContainer";
import { LANDING_ASSETS } from "@/components/landing/landingAssets";
import { LANDING_PANEL } from "@/components/landing/landingPanel";
import { VehicleExperienceVideo } from "@/components/landing/VehicleExperienceMedia";

const SITUATIONS = [
  {
    icon: Plane,
    title: "Transfert aéroport en groupe",
    text: "Toute l’équipe dans un seul véhicule, plus de taxis à recoller.",
  },
  {
    icon: PartyPopper,
    title: "Mariage, séminaire, événement",
    text: "Arrivées coordonnées, looks préservés, timing de cérémonie.",
  },
  {
    icon: Users,
    title: "Famille et bagages",
    text: "Enfants, valises, poussette — de la place sans négocier.",
  },
  {
    icon: Sofa,
    title: "Salon sur la route",
    text: "Sièges face à face, conversation, un van de confort routier.",
  },
] as const;

export function VanExperienceSection() {
  return (
    <section id="van" className={LANDING_PANEL}>
      <div className="flex min-h-0 flex-1 flex-col pt-16 md:grid md:grid-cols-2">
        <div className="order-2 flex min-h-0 flex-1 flex-col justify-center px-5 py-5 sm:px-10 lg:px-14 md:order-1">
          <FadeIn from="left" distance={40}>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-400 mb-3">
              Groupe
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Van de confort
            </h2>
            <p className="mt-3 text-neutral-400 max-w-md leading-relaxed">
              Jusqu’à 7 passagers, 7 bagages. Quand le trajet est déjà un
              moment à partager, pas un casse-tête logistique.
            </p>
          </FadeIn>
          <StaggerContainer
            stagger={0.08}
            className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          >
            {SITUATIONS.map((item, index) => (
              <StaggerItem
                key={item.title}
                from={index % 2 === 0 ? "right" : "left"}
                distance={28}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-sky-500/15 border border-sky-500/25 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-sky-400" aria-hidden />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-400 leading-snug">
                      {item.text}
                    </p>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
        <div className="relative order-1 h-[32vh] shrink-0 md:order-2 md:h-full md:min-h-0 md:flex-none">
          <VehicleExperienceVideo
            video={LANDING_ASSETS.vanVideo}
            poster={LANDING_ASSETS.vanPoster}
            overlay="from-sky-950/80"
          />
        </div>
      </div>
    </section>
  );
}
