"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { type VehicleOptions } from "@/lib/vehicle";
import { ReservationOptionsToggles } from "@/components/reservation/ReservationOptionsToggles";

interface OptionsStepProps {
  options: VehicleOptions;
  onOptionsChange: (options: VehicleOptions) => void;
  onSubmit: () => void;
  onPrevStep?: () => void;
}

export default function OptionsStep({
  options,
  onOptionsChange,
  onSubmit,
  onPrevStep,
}: Readonly<OptionsStepProps>) {
  return (
    <Card className="bg-neutral-900 border-neutral-800 text-white p-6">
      <h2 className="text-xl font-semibold mb-6">Options supplémentaires</h2>

      <div className="space-y-6">
        <p className="text-neutral-400">
          Personnalisez votre trajet avec des options supplémentaires
        </p>

        <div className="mt-6">
          <ReservationOptionsToggles
            options={options}
            onOptionsChange={onOptionsChange}
          />
        </div>

        <div className="flex gap-4 mt-8">
          <Button
            variant="outline"
            className="flex-1 text-white border-neutral-700 bg-neutral-800 hover:bg-neutral-700"
            onClick={onPrevStep}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={onSubmit}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finaliser
          </Button>
        </div>
      </div>
    </Card>
  );
}
