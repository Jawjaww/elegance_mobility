"use client";

import { Plane, Briefcase, Moon, Building2 } from "lucide-react";
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
    title: "Aéroport, solo ou duo",
    text: "Un départ silencieux, bagages chargés, horaire tenu jusqu’au terminal.",
  },
  {
    icon: Briefcase,
    title: "Rendez-vous d’affaires",
    text: "De l’hôtel au QG, vous arrivez net, sans chercher une place.",
  },
  {
    icon: Moon,
    title: "Soirée",
    text: "Restaurant, gala, club — la berline vous attend à la sortie.",
  },
  {
    icon: Building2,
    title: "Grand hôtel & ville à ville",
    text: "Un salon mobile entre deux adresses, rideaux tirés sur la route.",
  },
] as const;

export function BerlineExperienceSection() {
  return (
    <section id="berline" className={LANDING_PANEL}>
      <div className="flex min-h-0 flex-1 flex-col pt-16 md:grid md:grid-cols-2">
        <div className="relative h-[32vh] shrink-0 md:h-full md:min-h-0 md:flex-none">
          <VehicleExperienceVideo
            video={LANDING_ASSETS.berlineVideo}
            poster={LANDING_ASSETS.berlinePoster}
            overlay="from-blue-950/85"
          />
        </div>
        <div className="flex min-h-0 flex-1 flex-col justify-center px-5 py-5 sm:px-10 lg:px-14">
          <FadeIn from="right" distance={40}>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-400 mb-3">
              Executive
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
              Berline premium
            </h2>
            <p className="mt-3 text-neutral-400 max-w-md leading-relaxed">
              Jusqu’à 4 passagers, 3 bagages. Pour les trajets où l’allure compte
              autant que l’heure d’arrivée.
            </p>
          </FadeIn>
          <StaggerContainer
            stagger={0.08}
            className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
          >
            {SITUATIONS.map((item, index) => (
              <StaggerItem
                key={item.title}
                from={index % 2 === 0 ? "left" : "right"}
                distance={28}
              >
                <div className="flex gap-3">
                  <div className="mt-0.5 shrink-0 w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-blue-400" aria-hidden />
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
      </div>
    </section>
  );
}
