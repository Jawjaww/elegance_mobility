"use client";

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
  let validDate: Date;

  if (date instanceof Date) {
    validDate = date;
  } else if (date && typeof date === "string") {
    validDate = new Date(date);
  } else if (date && typeof date === "number") {
    validDate = new Date(date);
  } else {
    validDate = new Date();
  }

  if (Number.isNaN(validDate.getTime())) {
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

/**
 * Native browser datetime picker (`datetime-local` + showPicker).
 * Uses the OS/browser calendar UI — no custom calendar overlay.
 */
export function DateTimePicker({
  id,
  value,
  onChange,
  label,
  minDate = new Date(),
}: Readonly<DateTimePickerProps>) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const inputId = id || React.useId();

  const ensureValidDate = (
    dateInput: Date | string | number | null | undefined,
  ): Date => {
    if (dateInput instanceof Date && !Number.isNaN(dateInput.getTime())) {
      return new Date(dateInput);
    }

    if (
      dateInput &&
      (typeof dateInput === "string" || typeof dateInput === "number")
    ) {
      const parsedDate = new Date(dateInput);
      if (!Number.isNaN(parsedDate.getTime())) {
        return parsedDate;
      }
    }

    return new Date();
  };

  const currentDate = ensureValidDate(value);
  const { date: dateValue, time: timeValue } = formatDateForInput(currentDate);

  const handleDateTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    if (!raw) {
      onChange(null);
      return;
    }
    const newDateTime = new Date(raw);
    if (!Number.isNaN(newDateTime.getTime())) {
      onChange(new Date(newDateTime));
    }
  };

  const openNativePicker = () => {
    const el = inputRef.current;
    if (!el) return;
    try {
      if (typeof el.showPicker === "function") {
        el.showPicker();
      } else {
        el.focus();
        el.click();
      }
    } catch {
      el.focus();
    }
  };

  const minDateString = React.useMemo(() => {
    const { date, time } = formatDateForInput(minDate);
    return `${date}T${time}`;
  }, [minDate]);

  return (
    <div className="space-y-2 relative" style={{ colorScheme: "dark" }}>
      {label ? (
        <Label htmlFor={inputId} className="text-white">
          {label}
        </Label>
      ) : null}
      <div className="relative">
        <Input
          id={inputId}
          ref={inputRef}
          type="datetime-local"
          value={`${dateValue}T${timeValue}`}
          onChange={handleDateTimeChange}
          onClick={openNativePicker}
          onFocus={openNativePicker}
          min={minDateString}
          className="w-full pr-10 bg-neutral-900 border-neutral-700 text-white focus:border-neutral-500 focus:ring-neutral-500 [color-scheme:dark]"
        />
        <button
          type="button"
          onClick={openNativePicker}
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
