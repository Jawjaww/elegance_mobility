"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import type { VehicleType, VehicleOptions } from '../../lib/types';
import { Card } from "../ui/card";

interface VehicleStepProps {
  vehicleType: VehicleType;
  options: VehicleOptions;
  distance: number;
  duration: number;
  onVehicleTypeChange: (type: VehicleType) => void;
  onOptionsChange: (options: VehicleOptions) => void;
  onPrevious: () => void;
  onConfirm: () => void;
}

const VehicleStep: React.FC<VehicleStepProps> = ({
  vehicleType,
  options,
  onVehicleTypeChange,
  onOptionsChange,
  onPrevious,
  onConfirm
}) => {
  return (
    <div className="relative min-h-screen bg-neutral-950">
      <div className="absolute inset-0 perspective-1000">
        <div className="relative h-full w-full transform-style-3d">
          <div className="absolute inset-0 bg-[url('/car-bg.jpg')] bg-cover bg-center transform translate-z-[-100px] scale-1.2" />
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-3xl transform translate-z-[-50px]" />
        </div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8 py-24">
        <div className="w-full max-w-2xl space-y-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              Choisissez votre véhicule
            </h1>
          </div>

          <Card className="bg-neutral-900/50 backdrop-blur-lg border-neutral-800 p-6">
            <div className="space-y-6">
              <div>
                <Label className="text-xl font-semibold text-neutral-100 mb-4">Type de véhicule</Label>
                <RadioGroup
                  value={vehicleType}
                  onValueChange={(value: string) => onVehicleTypeChange(value as VehicleType)}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4"
                >
                  <div className="relative">
                    <RadioGroupItem value="STANDARD" id="standard" className="peer sr-only" />
                    <Label 
                      htmlFor="standard"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-neutral-700 bg-neutral-800/50 p-6 hover:bg-neutral-800 hover:border-neutral-600 transition-all cursor-pointer peer-data-[state=checked]:border-blue-500"
                    >
                      <span className="text-lg font-semibold text-neutral-100">Standard</span>
                      <div className="mt-2 text-neutral-400">
                        Mercedes Classe E<br/>
                        Jusqu&apos;à 4 passagers
                      </div>
                    </Label>
                  </div>

                  <div className="relative">
                    <RadioGroupItem value="PREMIUM" id="premium" className="peer sr-only" />
                    <Label 
                      htmlFor="premium"
                      className="flex flex-col items-center justify-between rounded-lg border-2 border-neutral-700 bg-neutral-800/50 p-6 hover:bg-neutral-800 hover:border-neutral-600 transition-all cursor-pointer peer-data-[state=checked]:border-blue-500"
                    >
                      <span className="text-lg font-semibold text-neutral-100">Premium</span>
                      <div className="mt-2 text-neutral-400">
                        Mercedes Classe V<br/>
                        Jusqu&apos;à 7 passagers
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <Label className="text-xl font-semibold text-neutral-100">Options supplémentaires</Label>
                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-700 bg-neutral-800/50">
                    <div className="space-y-1">
                      <Label className="text-neutral-100">Siège enfant</Label>
                      <p className="text-sm text-neutral-400">Siège adapté pour enfant</p>
                    </div>
                    <Switch
                      id="child-seat"
                      checked={options.childSeat}
                      onCheckedChange={(checked) => onOptionsChange({ ...options, childSeat: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg border border-neutral-700 bg-neutral-800/50">
                    <div className="space-y-1">
                      <Label className="text-neutral-100">Climatisation</Label>
                      <p className="text-sm text-neutral-400">Véhicule climatisé</p>
                    </div>
                    <Switch
                      id="air-conditioning"
                      checked={options.airConditioning}
                      onCheckedChange={(checked) => onOptionsChange({ ...options, airConditioning: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8 pt-4">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={onPrevious}
                  className="text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 rounded-md px-8 relative transition-all duration-300 ease-out transform overflow-hidden group bg-neutral-800 text-neutral-100 border-neutral-700 hover:bg-neutral-700"
                >
                  Retour
                </Button>
                <Button
                  size="lg"
                  onClick={onConfirm}
                  className="text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 rounded-md px-8 relative bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300 ease-out transform overflow-hidden group"
                >
                  Continuer
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VehicleStep;