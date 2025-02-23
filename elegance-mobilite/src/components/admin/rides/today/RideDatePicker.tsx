"use client"

import { CalendarIcon } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useRunsStore } from "@/lib/stores/runsStore"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"

export function RideDatePicker() {
  const { selectedDate, setSelectedDate } = useRunsStore()

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-start text-left font-normal md:w-[280px] bg-neutral-800/50 text-white hover:bg-neutral-50/10 hover:text-white"
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-white" />
          {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-neutral-800/50 text-white" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          initialFocus
          locale={fr}
          className="bg-neutral-800/50 text-white"
        />
      </PopoverContent>
    </Popover>
  )
}