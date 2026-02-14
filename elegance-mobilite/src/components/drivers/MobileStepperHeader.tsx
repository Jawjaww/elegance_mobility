"use client";

import { User as UserIcon, Briefcase, FileText, Shield, LucideIcon } from "lucide-react";

interface MobileStepperHeaderProps {
  currentSection: number;
  sections: { id: string; icon: LucideIcon; label: string; description: string }[];
}

export function MobileStepperHeader({ currentSection, sections }: MobileStepperHeaderProps) {
  const CurrentIcon = sections[currentSection].icon;
  
  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-white/5 md:hidden">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-white/5">
              <CurrentIcon className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">{sections[currentSection].description}</p>
              <h2 className="text-sm font-semibold text-white">{sections[currentSection].label}</h2>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Progrès</p>
            <p className="text-sm font-semibold text-blue-400">{currentSection + 1}/{sections.length}</p>
          </div>
        </div>
        <div className="flex gap-1 mt-3">
          {sections.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 flex-1 rounded-full transition-colors ${
                idx < currentSection ? "bg-emerald-500" : 
                idx === currentSection ? "bg-blue-500" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export const SECTIONS = [
  { id: "profil", icon: UserIcon, label: "Profil", description: "Informations personnelles" },
  { id: "professionnel", icon: Briefcase, label: "Professionnel", description: "Cartes et autorisations" },
  { id: "documents", icon: FileText, label: "Documents", description: "Justificatifs à fournir" },
  { id: "validation", icon: Shield, label: "Validation", description: "Vérification et envoi" },
];
