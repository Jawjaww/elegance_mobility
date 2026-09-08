"use client";

import React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

interface DateTimePickerProps {
  id?: string;
  value: Date;
  onChange: (date: Date | null) => void;
  label?: string;
  minDate?: Date;
  className?: string;
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
 * Hides the built-in calendar glyph so only one control opens the picker.
 */
export function DateTimePicker({
  id,
  value,
  onChange,
  label,
  minDate = new Date(),
  className,
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
    <div
      className={cn("space-y-2 relative", className)}
      style={{ colorScheme: "dark" }}
    >
      {label ? (
        <Label htmlFor={inputId} className="text-white">
          {label}
        </Label>
      ) : null}
      {/* Compact row: avoids a full-bleed field with a floating mid-calendar affordance */}
      <div className="flex w-full max-w-sm items-center gap-2">
        <Input
          id={inputId}
          ref={inputRef}
          type="datetime-local"
          value={`${dateValue}T${timeValue}`}
          onChange={handleDateTimeChange}
          onClick={openNativePicker}
          min={minDateString}
          className={cn(
            "min-w-0 flex-1 bg-neutral-950 border-neutral-800 text-white",
            "focus-visible:border-blue-500/55 focus-visible:ring-1 focus-visible:ring-blue-500/30 focus-visible:ring-offset-0 [color-scheme:dark]",
            // Hide native calendar glyph so only the Lucide button is visible
            "[&::-webkit-calendar-picker-indicator]:hidden",
          )}
        />
        <button
          type="button"
          onClick={openNativePicker}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-neutral-800 bg-neutral-950 text-neutral-400 transition-colors hover:border-blue-500/45 hover:bg-blue-500/10 hover:text-blue-400"
          aria-label="Ouvrir le calendrier"
        >
          <CalendarDays className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default DateTimePicker;
