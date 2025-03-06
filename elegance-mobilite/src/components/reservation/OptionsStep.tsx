"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ChevronLeft, CheckCircle } from "lucide-react";
import { VehicleOptions } from "@/lib/types";

interface OptionsStepProps {
  options: VehicleOptions;
  onSubmit: () => void;
  onPrevStep?: () => void;
}

export default function OptionsStep({ options, onSubmit, onPrevStep }: OptionsStepProps) {
  const [selectedOptions, setSelectedOptions] = useState<VehicleOptions>(options);
  
  const handleOptionChange = (option: keyof VehicleOptions) => {
    setSelectedOptions((prev) => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const handleSubmit = () => {
    onSubmit();
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
              <Label htmlFor="childSeat" className="text-base font-medium">Siège enfant</Label>
              <p className="text-sm text-neutral-400">Siège adapté pour enfant de 0-10 ans</p>
            </div>
            <Switch 
              id="childSeat" 
              checked={selectedOptions.childSeat || false}
              onCheckedChange={() => handleOptionChange('childSeat')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="pets" className="text-base font-medium">Animaux acceptés</Label>
              <p className="text-sm text-neutral-400">Transport d'animaux domestiques</p>
            </div>
            <Switch 
              id="pets" 
              checked={selectedOptions.pets || false}
              onCheckedChange={() => handleOptionChange('pets')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="accueil" className="text-base font-medium">Accueil personnalisé</Label>
              <p className="text-sm text-neutral-400">Pancarte à votre nom à l'aéroport/gare</p>
            </div>
            <Switch 
              id="accueil" 
              checked={selectedOptions.accueil || false}
              onCheckedChange={() => handleOptionChange('accueil')}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="boissons" className="text-base font-medium">Boissons fraîches</Label>
              <p className="text-sm text-neutral-400">Eau, jus et sodas à disposition</p>
            </div>
            <Switch 
              id="boissons" 
              checked={selectedOptions.boissons || false}
              onCheckedChange={() => handleOptionChange('boissons')}
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
            onClick={handleSubmit}
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Finaliser
          </Button>
        </div>
      </div>
    </Card>
  );
}
