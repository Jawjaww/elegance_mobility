"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { type VehicleOptions } from "@/lib/vehicle";

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
  const handleOptionChange = (
    option: keyof VehicleOptions,
    checked: boolean,
  ) => {
    onOptionsChange({
      ...options,
      [option]: checked,
    });
  };

  return (
    <Card className="bg-neutral-900 border-neutral-800 text-white p-6">
      <h2 className="text-xl font-semibold mb-6">Options supplémentaires</h2>

      <div className="space-y-6">
        <p className="text-neutral-400">
          Personnalisez votre trajet avec des options supplémentaires
        </p>

        <div className="space-y-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="childSeat" className="text-base font-medium">
                Siège enfant
              </Label>
              <p className="text-sm text-neutral-400">
                Siège adapté pour enfant de 0-10 ans
              </p>
            </div>
            <Switch
              id="childSeat"
              checked={Boolean(options.childSeat)}
              onCheckedChange={(checked) =>
                handleOptionChange("childSeat", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="petFriendly" className="text-base font-medium">
                Animaux acceptés
              </Label>
              <p className="text-sm text-neutral-400">
                Transport d&apos;animaux domestiques
              </p>
            </div>
            <Switch
              id="petFriendly"
              checked={Boolean(options.petFriendly)}
              onCheckedChange={(checked) =>
                handleOptionChange("petFriendly", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="accueil" className="text-base font-medium">
                Accueil personnalisé
              </Label>
              <p className="text-sm text-neutral-400">
                Pancarte à votre nom à l&apos;aéroport/gare
              </p>
            </div>
            <Switch
              id="accueil"
              checked={Boolean(options.accueil)}
              onCheckedChange={(checked) =>
                handleOptionChange("accueil", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="boissons" className="text-base font-medium">
                Boissons fraîches
              </Label>
              <p className="text-sm text-neutral-400">
                Eau, jus et sodas à disposition
              </p>
            </div>
            <Switch
              id="boissons"
              checked={Boolean(options.boissons)}
              onCheckedChange={(checked) =>
                handleOptionChange("boissons", checked)
              }
            />
          </div>
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
