"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { VehicleType, VehicleOptions } from "@/lib/types";

interface VehicleStepProps {
  vehicleType: VehicleType;
  options?: VehicleOptions;
  distance?: number;
  duration?: number;
  onVehicleTypeChange: (type: VehicleType) => void;
  onOptionsChange: (options: VehicleOptions) => void;
  onPrevious: () => void;
  onConfirm: () => void;
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = Math.round(minutes % 60);
  
  if (hours === 0) {
    return `${remainingMinutes} min`;
  }
  
  return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}min` : ''}`;
};

const vehicleOptions = [
  { value: 'STANDARD' as VehicleType, label: 'Berline Standard', description: 'Confort et élégance pour 4 passagers' },
  { value: 'LUXURY' as VehicleType, label: 'Berline Luxe', description: 'Luxe et raffinement pour 4 passagers' },
  { value: 'VAN' as VehicleType, label: 'Van', description: 'Espace et confort pour 7 passagers' }
];

const VehicleStep: React.FC<VehicleStepProps> = ({
  vehicleType,
  options = { childSeat: false, pets: false },
  distance,
  duration,
  onVehicleTypeChange,
  onOptionsChange,
  onPrevious,
  onConfirm,
}) => {
  const handleOptionChange = (option: Partial<VehicleOptions>) => {
    onOptionsChange({ ...options, ...option });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
          Sélectionnez votre véhicule
        </h2>

        <div>
          <div className="grid gap-4 text-neutral-100 mb-6">
            <RadioGroup 
              value={vehicleType} 
              onValueChange={(value) => onVehicleTypeChange(value as VehicleType)}
            >
              {vehicleOptions.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={option.value}
                    id={option.value}
                    className="border-neutral-400"
                  />
                  <Label
                    htmlFor={option.value}
                    className="text-neutral-100 font-semibold"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="space-y-4 pt-4 border-t border-neutral-700">
            <h3 className="font-semibold text-neutral-100">Options</h3>

            <div className="flex items-center justify-between">
              <div>
                <Label
                  htmlFor="child-seat"
                  className="text-neutral-100 text-sm font-medium"
                >
                  Siège enfant
                </Label>
                <p className="text-neutral-400 text-xs">Ajout 15€</p>
              </div>
              <div>
                <Switch
                  id="child-seat"
                  checked={options.childSeat}
                  onCheckedChange={(checked) =>
                    handleOptionChange({ childSeat: checked })
                  }
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label
                  htmlFor="pets"
                  className="text-neutral-100 text-sm font-medium"
                >
                  Animaux domestiques
                </Label>
                <p className="text-neutral-400 text-xs">Ajout 10€</p>
              </div>
              <div>
                <Switch
                  id="pets"
                  checked={options.pets}
                  onCheckedChange={(checked) =>
                    handleOptionChange({ pets: checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {distance && duration && (
        <div className="bg-neutral-800 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Distance</span>
            <span className="text-neutral-100 font-medium">
              {(distance / 1000).toFixed(1)} km
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-400">Durée estimée</span>
            <span className="text-neutral-100 font-medium">
              {formatDuration(duration / 60)}
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button
          onClick={onPrevious}
          variant="outline"
          className="bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-100"
        >
          Retour
        </Button>
        <Button onClick={onConfirm} className="bg-blue-600 hover:bg-blue-700">
          Confirmer
        </Button>
      </div>
    </div>
  );
};

export default VehicleStep;