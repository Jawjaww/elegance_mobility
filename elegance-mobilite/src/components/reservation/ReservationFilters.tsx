"use client"

import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon } from "lucide-react"
import { ALL_UI_STATUSES, STATUS_LABELS, type UiStatus } from "@/lib/services/statusService"

type FilterStatus = UiStatus | 'all'

const ALL_FILTER_STATUSES = ['all', ...ALL_UI_STATUSES] as const

interface ReservationFiltersProps {
  onFilterChange: (filters: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) => void;
}

export function ReservationFilters({ onFilterChange }: ReservationFiltersProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("all")

  const handleStatusChange = (value: FilterStatus) => {
    setSelectedStatus(value)
    onFilterChange({ status: value })
  }

  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date)
    if (date) {
      onFilterChange({ startDate: date })
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full sm:w-[240px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedDate ? (
              format(selectedDate, "PPP", { locale: fr })
            ) : (
              <span>Sélectionner une date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateChange}
            initialFocus
            locale={fr}
          />
        </PopoverContent>
      </Popover>

      <Select
        value={selectedStatus}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full sm:w-[200px]">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          {ALL_FILTER_STATUSES.map((status) => (
            <SelectItem key={status} value={status}>
              {status === 'all'
                ? "Tous les statuts"
                : STATUS_LABELS[status as UiStatus] || status
              }
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
