"use client";

import { Button } from "@/components/ui/button";
import { type VehicleType, type VehicleOptions } from "@/lib/vehicle";
import { formatDuration, cn } from "@/lib/utils";
import { ReservationOptionsToggles } from "@/components/reservation/ReservationOptionsToggles";
import {
  LANDING_CTA,
  RESERVATION_PICKER_CARD,
  RESERVATION_PICKER_CARD_SELECTED,
  RESERVATION_PICKER_ICON,
  RESERVATION_PICKER_ICON_SELECTED,
} from "@/components/landing/landingSurface";
import { Car, Check, Sparkles, Users, type LucideIcon } from "lucide-react";

export interface VehicleStepProps {
  vehicleType: VehicleType;
  options: VehicleOptions;
  distance?: number;
  duration?: number;
  onVehicleTypeChange: (type: VehicleType) => void;
  onOptionsChange: (options: VehicleOptions) => void;
  onPrevious: () => void;
  onConfirm: () => void;
  isEditing?: boolean;
}

const vehicleOptions: ReadonlyArray<{
  value: VehicleType;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    value: "STANDARD",
    label: "Berline",
    description: "4 passagers, 3 bagages. Confort au quotidien.",
    icon: Car,
  },
  {
    value: "PREMIUM",
    label: "Berline premium",
    description: "L’allure, et l’heure d’arrivée.",
    icon: Sparkles,
  },
  {
    value: "VAN",
    label: "Van de confort",
    description: "7 sièges, tout le bagage. Le groupe part ensemble.",
    icon: Users,
  },
];

const VehicleStep: React.FC<VehicleStepProps> = ({
  vehicleType,
  options,
  distance,
  duration,
  onVehicleTypeChange,
  onOptionsChange,
  onPrevious,
  onConfirm,
}) => {
  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-white md:text-base lg:mb-4">
          Choisissez votre véhicule
        </h2>

        <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4 lg:mb-8 lg:gap-5">
          {vehicleOptions.map((option) => {
            const selected = vehicleType === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-4 text-left transition-all duration-200 md:p-5",
                  selected
                    ? RESERVATION_PICKER_CARD_SELECTED
                    : RESERVATION_PICKER_CARD,
                )}
                onClick={() => onVehicleTypeChange(option.value)}
              >
                {selected ? (
                  <span
                    className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-white"
                    aria-hidden
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                ) : null}

                <div className="mb-3 flex items-center gap-3 pr-6">
                  <span
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                      selected
                        ? RESERVATION_PICKER_ICON_SELECTED
                        : RESERVATION_PICKER_ICON,
                    )}
                  >
                    <Icon className="h-5 w-5 text-blue-400" aria-hidden />
                  </span>
                  <h3 className="text-base font-semibold leading-snug text-white">
                    {option.label}
                  </h3>
                </div>

                <p className="text-sm leading-relaxed text-neutral-400">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        <div className="space-y-2.5 border-t border-blue-500/15 pt-3 md:space-y-4 md:pt-4 lg:space-y-4 lg:pt-6">
          <h3 className="text-sm font-semibold text-white md:text-base">
            Options
          </h3>
          <ReservationOptionsToggles
            options={options}
            onOptionsChange={onOptionsChange}
            compact
          />
        </div>
      </div>

      {distance && duration ? (
        <div className="hidden rounded-2xl border border-neutral-800 bg-neutral-900/80 px-5 py-4 lg:flex lg:items-center lg:justify-between">
          <div>
            <p className="text-sm text-neutral-400">Distance</p>
            <p className="font-medium text-white">{distance.toFixed(1)} km</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-neutral-400">Durée estimée</p>
            <p className="font-medium text-white">{formatDuration(duration)}</p>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-4 pt-2 lg:flex-row lg:items-center lg:justify-between lg:pt-0">
        {distance && duration ? (
          <p className="text-sm text-neutral-400 lg:hidden">
            <span className="font-medium text-white">{distance.toFixed(1)} km</span>
            <span className="mx-2 text-neutral-600">·</span>
            <span className="font-medium text-white">
              {formatDuration(duration)}
            </span>
          </p>
        ) : null}

        <div className="flex justify-between gap-3 lg:ml-auto lg:justify-end lg:gap-4">
          <Button
            onClick={onPrevious}
            variant="outline"
            className="border-blue-400/30 bg-transparent text-white hover:bg-blue-500/15"
          >
            Retour
          </Button>
          <Button onClick={onConfirm} className={LANDING_CTA}>
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleStep;
