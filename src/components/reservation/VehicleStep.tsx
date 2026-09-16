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
  const selectedVehicle = vehicleOptions.find(
    (option) => option.value === vehicleType,
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      <div>
        <h2 className="mb-3 text-sm font-semibold text-white md:text-base lg:mb-4">
          Choisissez votre véhicule
        </h2>

        <div className="mb-3 grid grid-cols-3 gap-2 md:mb-6 md:gap-4 lg:mb-8 lg:gap-5">
          {vehicleOptions.map((option) => {
            const selected = vehicleType === option.value;
            const Icon = option.icon;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                className={cn(
                  "relative flex flex-col rounded-2xl border p-2.5 text-center transition-all duration-200 md:p-5 md:text-left",
                  selected
                    ? RESERVATION_PICKER_CARD_SELECTED
                    : RESERVATION_PICKER_CARD,
                )}
                onClick={() => onVehicleTypeChange(option.value)}
              >
                {selected ? (
                  <span
                    className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white md:right-3 md:top-3 md:h-5 md:w-5"
                    aria-hidden
                  >
                    <Check className="h-2.5 w-2.5 md:h-3 md:w-3" strokeWidth={3} />
                  </span>
                ) : null}

                <div className="flex flex-col items-center gap-1.5 md:mb-3 md:flex-row md:items-center md:gap-3 md:pr-6">
                  <span
                    className={cn(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border md:h-10 md:w-10",
                      selected
                        ? RESERVATION_PICKER_ICON_SELECTED
                        : RESERVATION_PICKER_ICON,
                    )}
                  >
                    <Icon className="h-4 w-4 text-blue-400 md:h-5 md:w-5" aria-hidden />
                  </span>
                  <h3 className="text-[11px] font-semibold leading-tight text-white md:text-base md:leading-snug">
                    {option.label}
                  </h3>
                </div>

                <p className="hidden text-sm leading-relaxed text-neutral-400 md:block">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>

        {/*
         * Mobile keeps the tile row one-line high, so the selected vehicle
         * description lives below the deck instead of inside every card.
         */}
        {selectedVehicle ? (
          <p className="mb-4 text-xs leading-snug text-neutral-400 md:hidden">
            {selectedVehicle.description}
          </p>
        ) : null}

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

      <div className="flex flex-col gap-4 pt-2 lg:gap-5 lg:pt-0">
        {distance && duration ? (
          <p className="text-sm text-neutral-400 lg:hidden">
            <span className="font-medium text-white">{distance.toFixed(1)} km</span>
            <span className="mx-2 text-neutral-600">·</span>
            <span className="font-medium text-white">
              {formatDuration(duration)}
            </span>
          </p>
        ) : null}

        <div className="flex w-full flex-col gap-3 sm:flex-row lg:gap-5">
          <Button
            onClick={onPrevious}
            variant="outline"
            className="min-h-11 w-full flex-1 px-8 text-base border-blue-400/30 bg-transparent text-white hover:bg-blue-500/15 md:min-h-12 md:px-10"
          >
            Retour
          </Button>
          <Button
            onClick={onConfirm}
            className={`min-h-11 w-full flex-1 px-8 text-base md:min-h-12 md:px-10 ${LANDING_CTA}`}
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VehicleStep;
