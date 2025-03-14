'use client'

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore"
import { useDriversStore } from "@/lib/driversStore"
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
import { CalendarIcon, FilterIcon, UserIcon, ListFilterIcon } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "../../../components/ui/collapsible"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

const statusOptions = [
  { value: "all", label: "Toutes les courses" },
  { value: "unassigned", label: "Non assignées" },
  { value: "pending", label: "En attente" },
  { value: "in-progress", label: "En cours" },
  { value: "completed", label: "Terminées" },
  { value: "canceled", label: "Annulées" },
]

export function RidesFilters() {
  const { selectedDate, selectedStatus, driverFilter, setSelectedDate, setSelectedStatus, setDriverFilter } = useUnifiedRidesStore()
  const { drivers } = useDriversStore()
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-800/40 rounded-lg">
      {/* Desktop view - all filters side by side */}
      <div className="hidden md:flex md:gap-4">
        {/* Date selector */}
        <div className="w-[240px]">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal bg-gray-800/50 text-white hover:bg-gray-800/70 transition-colors"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>
        </div>
        {/* Status Select */}
        <div className="w-[200px]">
          <Select
            value={selectedStatus}
            onValueChange={value => setSelectedStatus(value as any)}
          >
            <SelectTrigger className="w-full bg-gray-800/50 text-white border-gray-700 hover:bg-gray-800/70 transition-colors">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Driver Select */}
        <div className="w-[200px]">
          <Select
            value={driverFilter || "all"}
            onValueChange={value => setDriverFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full bg-gray-800/50 text-white border-gray-700 hover:bg-gray-800/70 transition-colors">
              <SelectValue placeholder="Chauffeur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les chauffeurs</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id}>
                  {driver.first_name} {driver.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Mobile view - date picker with collapsible filters */}
      <div className="md:hidden space-y-2">
        {/* Date selector */}
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 justify-start text-left font-normal bg-gray-800/50 text-white hover:bg-gray-800/70 hover:text-gray-100/90 transition-colors"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                locale={fr}
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            className={cn(
              "bg-gray-800/50 hover:bg-gray-800/70 hover:text-whitetransition-colors text-blue-400",
              isFiltersOpen && "border-blue-500/50 bg-gray-800/70 text-blue-400"
            )}
            onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          >
            <FilterIcon className="h-4 w-4" />
          </Button>
        </div>

        <Collapsible open={isFiltersOpen} className="space-y-2">
          <CollapsibleContent className="space-y-2 data-[state=open]:animate-slideDown data-[state=closed]:animate-slideUp">
            {/* Status Select */}
            <Select
              value={selectedStatus}
              onValueChange={value => setSelectedStatus(value as any)}
            >
              <SelectTrigger className="w-full bg-gray-800/50 text-white border-gray-700 hover:bg-gray-800/70 transition-colors ">
                <ListFilterIcon className="mr-2 h-4 w-4 " />
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Driver Select */}
            <Select
              value={driverFilter || "all"}
              onValueChange={value => setDriverFilter(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-full bg-gray-800/50 text-white border-gray-700 hover:bg-gray-800/70 transition-colors ">
                <UserIcon className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Chauffeur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les chauffeurs</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.first_name} {driver.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  )
}
