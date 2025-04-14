import React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { CalendarDays } from "lucide-react";

interface DateTimePickerProps {
  id?: string;
  value: Date;
  onChange: (date: Date | null) => void;
  label?: string;
  minDate?: Date;
}

const formatDateForInput = (date: Date | string | number | null | undefined) => {
  // Vérifier si la date est valide et la convertir si nécessaire
  let validDate: Date;
  
  if (date instanceof Date) {
    validDate = date;
  } else if (date && typeof date === 'string') {
    validDate = new Date(date);
  } else if (date && typeof date === 'number') {
    validDate = new Date(date);
  } else {
    validDate = new Date();
    console.warn("DateTimePicker: Invalid date provided, using current date instead", date);
  }
  
  // Vérifier si la conversion a réussi
  if (isNaN(validDate.getTime())) {
    console.warn("DateTimePicker: Date conversion failed, using current date instead", date);
    validDate = new Date();
  }

  const year = validDate.getFullYear();
  const month = String(validDate.getMonth() + 1).padStart(2, "0");
  const day = String(validDate.getDate()).padStart(2, "0");
  const hours = String(validDate.getHours()).padStart(2, "0");
  const minutes = String(validDate.getMinutes()).padStart(2, "0");
  
  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
};

export function DateTimePicker({
  id,
  value,
  onChange,
  label,
  minDate = new Date(),
}: DateTimePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = id || React.useId();

  // S'assurer que la date est valide
  const ensureValidDate = (dateInput: Date | string | number | null | undefined): Date => {
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      return new Date(dateInput.getTime()); // Créer une nouvelle instance
    }
    
    if (dateInput && (typeof dateInput === 'string' || typeof dateInput === 'number')) {
      const parsedDate = new Date(dateInput);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    return new Date(); // Date par défaut si invalide
  };

  // État local pour la date
  const currentDate = ensureValidDate(value);
  const { date: dateValue, time: timeValue } = formatDateForInput(currentDate);

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const newDateTime = new Date(e.target.value);
      
      // Vérifier si la date est valide
      if (!isNaN(newDateTime.getTime())) {
        // Copier la date pour éviter les modifications par référence
        const safeDate = new Date(newDateTime.getTime());
        onChange(safeDate);
      } else {
        console.warn("Invalid date input:", e.target.value);
      }
    } catch (error) {
      console.error("Error parsing date:", error);
    }
  };

  // Formater la date minimum
  const minDateString = React.useMemo(() => {
    try {
      const { date, time } = formatDateForInput(minDate);
      return `${date}T${time}`;
    } catch (error) {
      console.error("Error formatting minDate:", error);
      return formatDateForInput(new Date()).date;
    }
  }, [minDate]);

  return (
    <div className="space-y-2 relative">
      {label && <Label htmlFor={inputId} className="text-white">{label}</Label>}
      <div className="relative">
        <Input
          id={inputId}
          ref={inputRef}
          type="datetime-local"
          value={`${dateValue}T${timeValue}`}
          onChange={handleDateTimeChange}
          min={minDateString}
          className="w-full pr-10 bg-neutral-900 border-neutral-700 text-white focus:border-neutral-500 focus:ring-neutral-500"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.showPicker()}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
          aria-label="Ouvrir le calendrier"
        >
          <CalendarDays className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default DateTimePicker;
