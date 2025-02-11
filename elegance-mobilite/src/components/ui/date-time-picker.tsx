import React from "react";
import { Input } from "./input";
import { Label } from "./label";

interface DateTimePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  minDate?: Date;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  minDate = new Date()
}: DateTimePickerProps) {
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
    if (minDate && newDate < minDate) {
      onChange(minDate);
    } else {
      onChange(newDate);
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Input
        type="datetime-local"
        value={formatDateForInput(value)}
        onChange={handleChange}
        min={formatDateForInput(minDate)}
        className="w-full"
      />
    </div>
  );
}