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
    // Si la date est null, undefined, ou invalide, utiliser la date actuelle
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

  const ensureValidDate = (dateInput: Date | string | number | null | undefined): Date => {
    if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
      return dateInput;
    }
    
    if (dateInput && (typeof dateInput === 'string' || typeof dateInput === 'number')) {
      const parsedDate = new Date(dateInput);
      if (!isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }
    
    return new Date(); // Date par défaut si invalide
  };

  const currentDate = ensureValidDate(value);
  const { date: dateValue, time: timeValue } = formatDateForInput(currentDate);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDateValue = e.target.value;
    if (!newDateValue) return; // Ignorer les valeurs vides
    
    const [year, month, day] = newDateValue.split("-").map(Number);
    const newDate = ensureValidDate(value); // Utiliser la date courante comme base
    newDate.setFullYear(year);
    newDate.setMonth(month - 1); // Les mois commencent à 0 en JavaScript
    newDate.setDate(day);
    
    onChange(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTimeValue = e.target.value;
    if (!newTimeValue) return; // Ignorer les valeurs vides
    
    const [hours, minutes] = newTimeValue.split(":").map(Number);
    const newDate = ensureValidDate(value); // Utiliser la date courante comme base
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    
    onChange(newDate);
  };

  return (
    <div className="space-y-2 relative">
      {label && <Label htmlFor={inputId} className="text-white">{label}</Label>}
      <div className="relative">
        <Input
          id={inputId}
          ref={inputRef}
          type="datetime-local"
          value={`${dateValue}T${timeValue}`}
          onChange={handleDateChange}
          min={formatDateForInput(minDate).date}
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