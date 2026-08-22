"use client";

import { Button } from "@/components/ui/button";
import { type VehicleType, type VehicleOptions } from "@/lib/vehicle";
import { formatDuration } from "@/lib/utils";
import { ReservationOptionsToggles } from "@/components/reservation/ReservationOptionsToggles";

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
    label: "Berline Standard",
    description: "Confort et élégance pour 4 passagers",
  },
  {
    value: "PREMIUM" as VehicleType,
    label: "Berline Premium",
    description: "Véhicule Premium et raffinement pour 4 passagers",
  },
  {
    value: "VAN" as VehicleType,
    label: "Van",
    description: "Espace et confort pour 7 passagers",
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
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Sélectionnez votre véhicule
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {vehicleOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={vehicleType === option.value}
              className={`relative p-4 rounded-lg border transition-all duration-200 ${
                vehicleType === option.value
                  ? "bg-blue-600/20 border-blue-500"
                  : "bg-neutral-800/50 border-neutral-700 hover:bg-neutral-800"
              }`}
              onClick={() => onVehicleTypeChange(option.value)}
            >
              <div className="mb-2">
                <h3 className="font-semibold text-neutral-100">
                  {option.label}
                </h3>
                <p className="text-sm text-neutral-400">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-4 pt-4 border-t border-neutral-700">
          <h3 className="font-semibold text-neutral-100">Options</h3>
          <ReservationOptionsToggles
            options={options}
            onOptionsChange={onOptionsChange}
            compact
          />
        </div>
      </div>

      {distance && duration ? (
        <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Distance</span>
            <span className="text-neutral-100 font-medium">
              {distance.toFixed(1)} km
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Durée estimée</span>
            <span className="text-neutral-100 font-medium">
              {formatDuration(duration)}
            </span>
          </div>
        </div>
      ) : null}

      <div className="flex justify-between pt-4">
        <Button
          onClick={onPrevious}
          variant="outline"
          className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-100"
        >
          Retour
        </Button>
        <Button
          onClick={onConfirm}
          className="py-2 inline-flex items-center justify-center hover:bg-primary/90 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 rounded-md px-8 relative bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300 ease-out"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
};

export default VehicleStep;
