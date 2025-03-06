"use client";

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface DateTimeStepProps {
  pickupDateTime: Date | string | null;
  onDateTimeSelect: (date: Date) => void;
  onNextStep?: () => void;
  onPrevStep?: () => void;
}

export default function DateTimeStep({ 
  pickupDateTime, 
  onDateTimeSelect, 
  onNextStep, 
  onPrevStep 
}: DateTimeStepProps) {
  // Convertir la date si nécessaire
  const [date, setDate] = useState<Date>(() => {
    if (pickupDateTime instanceof Date) return pickupDateTime;
    if (typeof pickupDateTime === 'string') return new Date(pickupDateTime);
    
    // Date par défaut: 3h dans le futur
    const defaultDate = new Date();
    defaultDate.setHours(defaultDate.getHours() + 3);
    return defaultDate;
  });

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setDate(newDate);
      onDateTimeSelect(newDate);
    }
  };

  // Calculer la date minimale (maintenant + 1h)
  const getMinDate = () => {
    const now = new Date();
    now.setHours(now.getHours() + 1);
    return now;
  };

  return (
    <Card className="bg-neutral-900 border-neutral-800 text-white p-6">
      <h2 className="text-xl font-semibold mb-6">Sélectionner la date et l'heure</h2>
      
      <div className="space-y-6">
        <p className="text-neutral-400">
          Quand souhaitez-vous être pris en charge ?
        </p>
        
        <div className="flex justify-center py-4">
          <DateTimePicker
            value={date}
            onChange={handleDateChange}
            minDate={getMinDate()}
            label="Date et heure de prise en charge"
          />
        </div>
        
        <p className="text-sm text-neutral-500">
          Veuillez réserver au moins 1 heure à l'avance.
        </p>
        
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
            onClick={onNextStep}
          >
            Continuer
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
