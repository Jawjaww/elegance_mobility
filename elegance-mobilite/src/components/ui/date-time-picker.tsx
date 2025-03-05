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

export function DateTimePicker({
  id,
  value,
  onChange,
  label,
  minDate = new Date(),
}: DateTimePickerProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = id || React.useId();

  const formatDateForInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = new Date(e.target.value);
    if (!isNaN(newDate.getTime())) {
      if (minDate && newDate < minDate) {
        onChange(minDate);
      } else {
        onChange(newDate);
      }
    }
  };

  return (
    <div className="space-y-2 relative">
      {label && <Label htmlFor={inputId} className="text-white">{label}</Label>}
      <div className="relative">
        <Input
          id={inputId}
          ref={inputRef}
          type="datetime-local"
          value={formatDateForInput(value)}
          onChange={handleChange}
          min={formatDateForInput(minDate)}
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