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
import {
  RESERVATION_PICKER_CARD,
  RESERVATION_PICKER_CARD_SELECTED,
  RESERVATION_PICKER_ICON,
  RESERVATION_PICKER_ICON_SELECTED,
} from "@/components/landing/landingSurface";

interface ReservationOptionsTogglesProps {
  options: VehicleOptions;
  onOptionsChange: (options: VehicleOptions) => void;
  compact?: boolean;
}

const SHORT_LABELS: Record<string, string> = {
  "Siège enfant": "Siège enfant",
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
              // Two lines per option: the label owns a line, the price sits under it. The
              // single-row variant shared the tile's width between the two, which left the label
              // ~64px wide at 360px and clipped the longest name — "Siège enfant" measured 68px
              // of text in 64px of room. Stacking costs a line per tile and buys back the
              // ellipsis, i.e. a label the reader cannot finish. `pr-6` stays reserved for the
              // selected badge in the corner.
              "relative flex items-center gap-2 rounded-xl border py-1.5 pl-2.5 pr-6 transition-all duration-200 md:gap-2.5 md:py-2 md:pl-3 md:pr-7",
              selected
                ? RESERVATION_PICKER_CARD_SELECTED
                : RESERVATION_PICKER_CARD,
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

            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border md:h-7 md:w-7",
                selected
                  ? RESERVATION_PICKER_ICON_SELECTED
                  : RESERVATION_PICKER_ICON,
              )}
            >
              <Icon className="h-3.5 w-3.5 text-blue-400" aria-hidden />
            </span>
            {/*
              Deliberately without `truncate`: a clipped option name is the defect this layout
              exists to remove. The label wraps instead, and `min-w-0` lets it do so in the row.
            */}
            <span className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
              <span className="text-xs font-semibold leading-tight text-white lg:text-sm">
                {label}
              </span>
              <span className="text-[10px] font-medium leading-tight text-blue-300/90 lg:text-xs">
                {price}
              </span>
            </span>
          </button>
        );
      })}
    </fieldset>
  );
}
