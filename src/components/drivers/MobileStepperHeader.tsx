"use client";

import {
  User as UserIcon,
  Briefcase,
  FileText,
  Shield,
  LucideIcon,
} from "lucide-react";

interface MobileStepperHeaderProps {
  currentSection: number;
  sections: {
    id: string;
    icon: LucideIcon;
    label: string;
    description: string;
  }[];
}

export function MobileStepperHeader({
  currentSection,
  sections,
}: MobileStepperHeaderProps) {
  const CurrentIcon = sections[currentSection].icon;

  // Palette harmonisée :
  // --elegant-accent: #4a77a8 (bleu principal)
  // Royal blue lumineux : #5eaaff, #4a77a8, #b3d8ff
  // Pour le progress bar : dégradé royal blue + glow subtil
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl border-b border-white/[0.06] md:hidden"
      style={{ background: "rgba(25, 27, 30, 0.85)" }}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="p-2 rounded-lg bg-white/[0.04] border"
              style={{ borderColor: "#4a77a8" }}
            >
              <CurrentIcon className="h-4 w-4" style={{ color: "#4a77a8" }} />
            </div>
            <div>
              <p className="text-xs text-gray-500">
                {sections[currentSection].description}
              </p>
              <h2
                className="text-sm font-semibold"
                style={{ color: "#4a77a8" }}
              >
                {sections[currentSection].label}
              </h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Progrès</p>
            <p className="text-sm font-semibold" style={{ color: "#4a77a8" }}>
              {currentSection + 1}/{sections.length}
            </p>
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          {sections.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx < currentSection
                  ? "" // custom color below
                  : idx === currentSection
                    ? "" // custom color below
                    : "bg-white/[0.08]"
              }`}
              style={
                idx < currentSection
                  ? {
                      background:
                        "linear-gradient(90deg, #0077ff 0%, #73b4ff 60%, #236af8 100%)",
                      boxShadow: "0 0 10px 2px #5eaaffcc, 0 0 4px 0 #2374ff99",
                    }
                  : idx === currentSection
                    ? {
                        background:
                          "linear-gradient(90deg, #2f90ff 0%, #236af8 60%, #007bff 100%)",
                        opacity: 0.6,
                        boxShadow: "0 0 8px 1px #3c81ff88",
                      }
                    : undefined
              }
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const SECTIONS = [
  {
    id: "profil",
    icon: UserIcon,
    label: "Profil",
    description: "Informations personnelles",
  },
  {
    id: "professionnel",
    icon: Briefcase,
    label: "Professionnel",
    description: "Cartes et autorisations",
  },
  {
    id: "documents",
    icon: FileText,
    label: "Documents",
    description: "Justificatifs à fournir",
  },
  {
    id: "validation",
    icon: Shield,
    label: "Validation",
    description: "Vérification et envoi",
  },
];
