"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  asapPickupDateTime,
  RESERVATION_MIN_LEAD_MS,
} from "@/lib/utils/normalizePickupDateTime";

interface DateTimeStepProps {
  pickupDateTime: Date | string | null;
  onDateTimeSelect: (date: Date) => void;
}

function parsePickup(value: Date | string | null | undefined): Date | null {
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export default function DateTimeStep({
  pickupDateTime,
  onDateTimeSelect,
}: Readonly<DateTimeStepProps>) {
  const [date, setDate] = useState<Date>(() => {
    return parsePickup(pickupDateTime) ?? asapPickupDateTime();
  });

  useEffect(() => {
    const next = parsePickup(pickupDateTime);
    if (!next) return;
    setDate(next);
  }, [pickupDateTime]);

  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setDate(newDate);
      onDateTimeSelect(newDate);
    }
  };

  const handleAsap = () => {
    const asap = asapPickupDateTime();
    setDate(asap);
    onDateTimeSelect(asap);
  };

  const getMinDate = () => new Date(Date.now() + RESERVATION_MIN_LEAD_MS);

  return (
    // One row: the picker and the shortcut sit side by side. Stacked, the shortcut claimed a
    // line of its own (~44px) on a step that has to fit above the fold on a phone.
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <DateTimePicker
          value={date}
          onChange={handleDateChange}
          minDate={getMinDate()}
        />
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-10 shrink-0 whitespace-nowrap border-blue-400/30 bg-transparent px-2.5 text-xs text-white hover:bg-blue-500/15"
        onClick={handleAsap}
      >
        Au plus vite
      </Button>
    </div>
  );
}
