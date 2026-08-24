"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Users, Briefcase } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/StaggerContainer";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { LANDING_ASSETS } from "@/components/landing/landingAssets";

const VEHICLES = [
  {
    title: "Berline Premium",
    description:
      "Jusqu'à 4 passagers, 3 bagages — confort executive pour aéroport, business et soirées.",
    video: LANDING_ASSETS.berlineVideo,
    poster: LANDING_ASSETS.berlinePoster,
    icon: Briefcase,
    accent: "border-blue-500/25 from-blue-500/15",
    overlay: "from-blue-950/80",
    badge: "Executive",
  },
  {
    title: "Van de Luxe",
    description:
      "Jusqu'à 7 passagers, 7 bagages — idéal pour groupes, familles et transferts événementiels.",
    video: LANDING_ASSETS.vanVideo,
    poster: LANDING_ASSETS.vanPoster,
    icon: Users,
    accent: "border-sky-500/25 from-sky-500/10",
    overlay: "from-sky-950/70",
    badge: "Groupe",
  },
] as const;

function VehicleMedia({
  video,
  poster,
  overlay,
}: Readonly<{ video: string; poster: string; overlay: string }>) {
  const reducedMotion = usePrefersReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (reducedMotion || !videoRef.current) return;
    const el = videoRef.current;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void el.play().catch(() => undefined);
        else el.pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-t-2xl bg-neutral-900">
      {reducedMotion ? (
        <Image
          src={poster}
          alt=""
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      ) : (
        <motion.div
          className="absolute inset-0"
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <video
            ref={videoRef}
            muted
            loop
            playsInline
            preload="none"
            poster={poster}
            className="absolute inset-0 h-full w-full object-cover"
          >
            <source src={video} type="video/mp4" />
          </video>
        </motion.div>
      )}
      <div
        className={`absolute inset-0 bg-gradient-to-t ${overlay} via-transparent to-black/20 pointer-events-none`}
      />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-neutral-950/90 to-transparent pointer-events-none" />
    </div>
  );
}

export function VehicleShowcaseSection() {
  return (
    <section
      id="vehicules"
      className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative"
    >
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-transparent pointer-events-none"
      />
      <div className="max-w-6xl mx-auto relative">
        <FadeIn className="text-center mb-8 sm:mb-10">
          <p className="text-sm font-medium uppercase tracking-wider text-blue-400 mb-3">
            Notre flotte
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white">
            Voyagez avec style
          </h2>
          <p className="mt-3 text-neutral-400 max-w-2xl mx-auto">
            Berlines et vans haut de gamme, entretenus et conduits par des
            chauffeurs professionnels.
          </p>
        </FadeIn>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {VEHICLES.map((vehicle) => (
            <StaggerItem key={vehicle.title}>
              <article
                className={`rounded-2xl border bg-gradient-to-br ${vehicle.accent} to-neutral-950/80 backdrop-blur-sm overflow-hidden shadow-xl shadow-black/30 hover:shadow-blue-950/50 transition-shadow duration-300`}
              >
                <div className="relative">
                  <VehicleMedia
                    video={vehicle.video}
                    poster={vehicle.poster}
                    overlay={vehicle.overlay}
                  />
                  <span className="absolute top-4 left-4 rounded-full border border-white/20 bg-neutral-950/60 backdrop-blur-md px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-blue-200">
                    {vehicle.badge}
                  </span>
                </div>
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
                      <vehicle.icon
                        className="h-4 w-4 text-blue-400"
                        aria-hidden
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-white">
                      {vehicle.title}
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed">
                    {vehicle.description}
                  </p>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
}
