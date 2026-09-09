"use client";

import {
  Baby,
  Check,
  GlassWater,
  PawPrint,
  Plane,
  Sparkles,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { useAvailableOptions } from "@/hooks/useAvailableOptions";
import {
  formatOptionPrice,
  normalizeOptionName,
} from "@/lib/services/optionsCatalogService";
import type { VehicleOptions } from "@/lib/vehicle";
import { cn } from "@/lib/utils";

interface ReservationOptionsTogglesProps {
  options: VehicleOptions;
  onOptionsChange: (options: VehicleOptions) => void;
  compact?: boolean;
}

const SHORT_LABELS: Record<string, string> = {
  "Siège enfant": "Enfant",
  "Animaux domestiques": "Animaux",
  "Attente aéroport": "Aéroport",
  "Boissons premium": "Boissons",
  "WiFi à bord": "WiFi",
  "Accueil personnalisé": "Accueil",
};

function optionIcon(name: string): LucideIcon {
  const label = normalizeOptionName(name).toLowerCase();
  if (label.includes("siège") || label.includes("enfant") || label.includes("bébé")) {
    return Baby;
  }
  if (label.includes("animal")) return PawPrint;
  if (label.includes("aéroport") || label.includes("attente")) return Plane;
  if (label.includes("boisson")) return GlassWater;
  if (label.includes("wifi")) return Wifi;
  if (label.includes("accueil")) return Sparkles;
  return Sparkles;
}

function shortOptionLabel(name: string): string {
  const normalized = normalizeOptionName(name);
  if (SHORT_LABELS[normalized]) return SHORT_LABELS[normalized];
  return normalized.split(/\s+/)[0] ?? normalized;
}

function compactOptionPrice(price: number): string {
  if (price <= 0) return "Inclus";
  return `+${Math.round(price)}€`;
}

export function ReservationOptionsToggles({
  options,
  onOptionsChange,
  compact = false,
}: Readonly<ReservationOptionsTogglesProps>) {
  const { options: catalog, loading, error } = useAvailableOptions();

  const handleChange = (name: string, checked: boolean) => {
    const next: VehicleOptions = { ...options };
    for (const key of Object.keys(next)) {
      if (normalizeOptionName(key) === name) {
        delete next[key];
      }
    }
    next[name] = checked;
    onOptionsChange(next);
  };

  const isChecked = (name: string) => {
    if (options[name]) return true;
    return Object.entries(options).some(
      ([key, value]) => value === true && normalizeOptionName(key) === name,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-2 text-sm text-red-400">
        Options indisponibles pour le moment.
      </p>
    );
  }

  if (catalog.length === 0) {
    return (
      <p
        className={
          compact ? "text-xs text-neutral-400" : "text-sm text-neutral-400"
        }
      >
        Aucune option disponible
      </p>
    );
  }

  return (
    <fieldset className="m-0 grid grid-cols-2 gap-2 border-0 p-0 md:grid-cols-2 md:gap-2.5 lg:grid-cols-3">
      <legend className="sr-only">Options de trajet</legend>
      {catalog.map((option) => {
        const selected = isChecked(option.name);
        const Icon = optionIcon(option.name);
        const label = shortOptionLabel(option.name);
        const price = compactOptionPrice(Number(option.price));
        const ariaLabel = `${option.name}, ${formatOptionPrice(Number(option.price))}`;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            aria-label={ariaLabel}
            onClick={() => handleChange(option.name, !selected)}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 rounded-lg border px-2 py-2.5 transition-all duration-200 md:rounded-xl md:px-2.5 md:py-3",
              selected
                ? "border-blue-500/60 bg-blue-500/15"
                : "border-blue-500/20 bg-blue-500/[0.04] hover:border-blue-400/40",
            )}
          >
            {selected ? (
              <span
                className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white"
                aria-hidden
              >
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              </span>
            ) : null}

            <div className="flex items-center justify-center gap-1.5 pr-3">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border",
                  selected
                    ? "border-blue-400/40 bg-blue-500/20"
                    : "border-blue-500/25 bg-blue-500/10",
                )}
              >
                <Icon className="h-3.5 w-3.5 text-blue-400" aria-hidden />
              </span>
              <span className="text-xs font-semibold leading-none text-white">
                {label}
              </span>
            </div>

            <span className="text-[10px] font-medium leading-none text-blue-300/90">
              {price}
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
