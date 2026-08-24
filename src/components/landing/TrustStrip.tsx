"use client";

import { BadgeCheck, Clock, Shield, Wallet } from "lucide-react";
import {
  StaggerContainer,
  StaggerItem,
} from "@/components/motion/StaggerContainer";

const TRUST_ITEMS = [
  {
    icon: Clock,
    label: "Devis instantané",
    tone: "text-blue-300 bg-blue-500/10 border-blue-500/25",
  },
  {
    icon: BadgeCheck,
    label: "Chauffeur professionnel",
    tone: "text-sky-300 bg-sky-500/10 border-sky-500/25",
  },
  {
    icon: Shield,
    label: "Réservation garantie",
    tone: "text-indigo-300 bg-indigo-500/10 border-indigo-500/25",
  },
  {
    icon: Wallet,
    label: "Tarif transparent",
    tone: "text-blue-200 bg-blue-400/10 border-blue-400/25",
  },
] as const;

export function TrustStrip() {
  return (
    <section className="relative -mt-8 sm:-mt-10 z-10 px-4 sm:px-6 lg:px-8">
      <StaggerContainer className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 rounded-2xl border border-blue-500/15 bg-neutral-900/85 backdrop-blur-xl p-4 sm:p-5 shadow-2xl shadow-blue-950/30">
        {TRUST_ITEMS.map(({ icon: Icon, label, tone }) => (
          <StaggerItem key={label}>
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${tone}`}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <p className="text-sm font-medium text-neutral-200 leading-snug">
                {label}
              </p>
            </div>
          </StaggerItem>
        ))}
      </StaggerContainer>
    </section>
  );
}
