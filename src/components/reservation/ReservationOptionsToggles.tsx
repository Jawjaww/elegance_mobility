"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAvailableOptions } from "@/hooks/useAvailableOptions";
import {
  formatOptionPrice,
  normalizeOptionName,
} from "@/lib/services/optionsCatalogService";
import type { VehicleOptions } from "@/lib/vehicle";

interface ReservationOptionsTogglesProps {
  options: VehicleOptions;
  onOptionsChange: (options: VehicleOptions) => void;
  compact?: boolean;
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
      <div className="flex items-center justify-center py-6">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-400 py-2">
        Options indisponibles pour le moment.
      </p>
    );
  }

  if (catalog.length === 0) {
    return (
      <p className={compact ? "text-neutral-400 text-xs" : "text-sm text-neutral-400"}>
        Aucune option disponible
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {catalog.map((option) => {
        const id = `opt-${option.id}`;
        return (
          <div key={option.id} className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <Label
                htmlFor={id}
                className={
                  compact
                    ? "text-neutral-100 text-sm font-medium"
                    : "text-base font-medium"
                }
              >
                {option.name}
              </Label>
              <p
                className={
                  compact
                    ? "text-neutral-400 text-xs"
                    : "text-sm text-neutral-400"
                }
              >
                {compact
                  ? formatOptionPrice(Number(option.price))
                  : option.description || formatOptionPrice(Number(option.price))}
              </p>
              {!compact && Number(option.price) > 0 && (
                <p className="text-xs text-neutral-500 mt-0.5">
                  {formatOptionPrice(Number(option.price))}
                </p>
              )}
            </div>
            <Switch
              id={id}
              checked={isChecked(option.name)}
              onCheckedChange={(checked) => handleChange(option.name, checked)}
            />
          </div>
        );
      })}
    </div>
  );
}
