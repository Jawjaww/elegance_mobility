import {
  Baby,
  GlassWater,
  PawPrint,
  Plane,
  Sparkles,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { normalizeOptionName } from "@/lib/services/optionsCatalogService";

const SHORT_LABELS: Record<string, string> = {
  "Siège enfant": "Siège enfant",
  "Animaux domestiques": "Animaux",
  "Attente aéroport": "Aéroport",
  "Boissons premium": "Boissons",
  "WiFi à bord": "WiFi",
  "Accueil personnalisé": "Accueil",
};

export function optionIcon(name: string): LucideIcon {
  const label = normalizeOptionName(name).toLowerCase();
  if (label.includes("siège") || label.includes("enfant") || label.includes("bébé")) {
    return Baby;
  }
  // The plural matters: French forms "animaux", and that does not contain the singular "animal"
  // (it ends in -aux, not -al). Testing only the singular left "Animaux domestiques" matching no
  // rule at all, so it fell through to the generic fallback below and showed a sparkle.
  if (label.includes("animal") || label.includes("animaux")) return PawPrint;
  if (label.includes("aéroport") || label.includes("attente")) return Plane;
  if (label.includes("boisson")) return GlassWater;
  if (label.includes("wifi")) return Wifi;
  if (label.includes("accueil")) return Sparkles;
  return Sparkles;
}

export function shortOptionLabel(name: string): string {
  const normalized = normalizeOptionName(name);
  if (SHORT_LABELS[normalized]) return SHORT_LABELS[normalized];
  return normalized.split(/\s+/)[0] ?? normalized;
}
