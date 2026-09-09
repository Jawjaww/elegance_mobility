"use client";

import { Button } from "@/components/ui/button";
import { type VehicleType, type VehicleOptions } from "@/lib/vehicle";
import { formatDuration } from "@/lib/utils";
import { ReservationOptionsToggles } from "@/components/reservation/ReservationOptionsToggles";
import { LANDING_CTA } from "@/components/landing/landingSurface";

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

const vehicleOptions = [
  {
    value: "STANDARD" as VehicleType,
    label: "Berline",
    description: "4 passagers, 3 bagages. Confort au quotidien.",
  },
  {
    value: "PREMIUM" as VehicleType,
    label: "Berline premium",
    description: "L’allure, et l’heure d’arrivée.",
  },
  {
    value: "VAN" as VehicleType,
    label: "Van de confort",
    description: "7 sièges, tout le bagage. Le groupe part ensemble.",
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
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-white mb-4">
          Choisissez votre trajet
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {vehicleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={vehicleType === option.value}
              className={`relative p-4 rounded-2xl border text-left transition-all duration-200 ${
                vehicleType === option.value
                  ? "bg-blue-500/15 border-blue-500/60"
                  : "bg-blue-500/[0.04] border-blue-500/20 hover:border-blue-400/40"
              }`}
              onClick={() => onVehicleTypeChange(option.value)}
            >
              <div className="mb-2">
                <h3 className="font-semibold text-white">{option.label}</h3>
                <p className="text-sm text-neutral-400">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-2.5 border-t border-blue-500/15 pt-3 md:space-y-4 md:pt-4">
          <h3 className="text-sm font-semibold text-white md:text-base">Options</h3>
          <ReservationOptionsToggles
            options={options}
            onOptionsChange={onOptionsChange}
            compact
          />
        </div>
      </div>

      {distance && duration ? (
        <div className="rounded-2xl border border-blue-500/20 bg-blue-500/[0.04] p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Distance</span>
            <span className="text-white font-medium">
              {distance.toFixed(1)} km
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Durée estimée</span>
            <span className="text-white font-medium">
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between pt-4">
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
  );
};

export default VehicleStep;
