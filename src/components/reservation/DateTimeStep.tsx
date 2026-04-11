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
      
  
        <div>
          <DateTimePicker
            value={date}
            onChange={handleDateChange}
            minDate={getMinDate()}
          />
        </div>     
  );
}
