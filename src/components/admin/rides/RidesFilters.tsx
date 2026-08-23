'use client'

import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore"
import { useDriversStore } from "@/lib/stores/driversStore"
import { StatusBadge } from "@/components/reservation/StatusBadge"
import { ALL_UI_STATUSES } from "@/lib/services/statusService"
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
import { Input } from "@/components/ui/input"
import { CalendarIcon, FilterIcon, UserIcon, ListFilterIcon, Users, Search, X } from "lucide-react"
import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { formatPersonName } from "@/lib/rides/rideCancelLabels"
import type { RideWithRelations } from "@/lib/stores/unifiedRidesStore"

const MONTHS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
] as const

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"] as const

function clientFilterLabel(ride: RideWithRelations): string {
  const name = formatPersonName(
    ride.customer?.first_name,
    ride.customer?.last_name,
  );
  if (name === "—") {
    return `Client #${(ride.user_id ?? "").slice(0, 8)}`;
  }
  const phone = ride.customer?.phone?.trim();
  if (phone) return `${name} · ${phone}`;
  return name;
}

function calendarTriggerLabel(
  viewMode: string,
  selectedDate: Date | null,
): string {
  if (!selectedDate) return "Sélectionner une date ou un mois"
  if (viewMode === "month") {
    return format(selectedDate, "MMMM yyyy", { locale: fr })
  }
  if (viewMode === "day") {
    return format(selectedDate, "PPPP", { locale: fr })
  }
  return "Sélectionner une date ou un mois"
}

function buildMonthDayCells(year: number, month: number): Array<number | null> {
  const firstDayOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7
  const cells: Array<number | null> = Array.from(
    { length: firstDayOfWeek },
    () => null,
  )
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day)
  }
  return cells
}

function isSameCalendarDay(
  selectedDate: Date | null | undefined,
  year: number,
  month: number,
  day: number,
): boolean {
  return (
    selectedDate?.getFullYear() === year &&
    selectedDate?.getMonth() === month &&
    selectedDate?.getDate() === day
  )
}

function isSameCalendarMonth(
  selectedDate: Date | null | undefined,
  year: number,
  month: number,
): boolean {
  return (
    selectedDate?.getFullYear() === year && selectedDate?.getMonth() === month
  )
}

export function RidesFilters() {
  const { 
    selectedDate,
    selectedStatus, 
    driverFilter,
    clientFilter,
    searchQuery,
    setSelectedDate, 
    setSelectedStatus, 
    setDriverFilter,
    setClientFilter,
    setSearchQuery,
    viewMode, 
    setViewMode,
    rides
  } = useUnifiedRidesStore()
  const { drivers } = useDriversStore()
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const clientOptions = useMemo(() => {
    const byId = new Map<string, { id: string; label: string }>();
    for (const ride of rides) {
      if (!ride.user_id || byId.has(ride.user_id)) continue;
      byId.set(ride.user_id, {
        id: ride.user_id,
        label: clientFilterLabel(ride),
      });
    }
    return Array.from(byId.values()).sort((a, b) =>
      a.label.localeCompare(b.label, "fr"),
    );
  }, [rides]);
  
  // Mode d'affichage : 'day' ou 'month' (stocké dans le store)
  const [month, setMonth] = useState<number>(selectedDate.getMonth())
  const [year, setYear] = useState<number>(selectedDate.getFullYear())

  // Navigation rapide jour précédent/suivant
  const handlePrevDay = () => {
    if (viewMode !== 'day') return
    const prevDay = new Date(selectedDate)
    prevDay.setDate(prevDay.getDate() - 1)
    setSelectedDate(prevDay)
    setMonth(prevDay.getMonth())
    setYear(prevDay.getFullYear())
  }

  const handleNextDay = () => {
    if (viewMode !== 'day') return
    const nextDay = new Date(selectedDate)
    nextDay.setDate(nextDay.getDate() + 1)
    setSelectedDate(nextDay)
    setMonth(nextDay.getMonth())
    setYear(nextDay.getFullYear())
  }

  // Sélection d'une date précise
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date)
      if (viewMode === 'month') {
        setViewMode('day')
        setMonth(date.getMonth())
        setYear(date.getFullYear())
      }
    }
  }

  const shiftMonth = (delta: -1 | 1) => {
    const nextMonth = (month + delta + 12) % 12
    const nextYear = month + delta < 0 ? year - 1 : month + delta > 11 ? year + 1 : year
    setMonth(nextMonth)
    setYear(nextYear)
    setSelectedDate(new Date(nextYear, nextMonth, 1))
  }

  const shiftYear = (delta: -1 | 1) => {
    const newYear = year + delta
    setYear(newYear)
    if (viewMode === 'month') {
      setSelectedDate(new Date(newYear, month, 1))
      return
    }
    if (viewMode === 'day' && selectedDate) {
      const newDate = new Date(selectedDate)
      newDate.setFullYear(newYear)
      setSelectedDate(newDate)
      setMonth(newDate.getMonth())
    }
  }

  const dayCells = useMemo(
    () => buildMonthDayCells(year, month),
    [year, month],
  )

  return (
    <div
      className="sticky top-16 z-40 mb-6 p-4 rounded-lg border border-neutral-800 w-full"
      style={{
        background: 'rgba(12, 12, 14, 0.35)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderColor: 'rgba(255,255,255,0.10)',
        boxShadow: '0 8px 32px 0 rgba(0,0,0,0.6)',
      }}
    >
      {/* Calendar + filter toggle */}
      <div className="flex flex-col sm:flex-row gap-4 mb-1 items-center w-full pt-2 pb-2">
        {/* Ligne calendrier + bouton filtre */}
        <div className="flex items-center gap-2 w-[80vw] mx-auto md:w-full md:max-w-none">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="flex-1 min-w-0 justify-start text-left font-normal"
                style={{
                  background: 'rgba(12, 12, 14, 0.25)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1.5px solid rgba(255,255,255,0.10)',
                  boxShadow: '0 4px 16px 0 rgba(0,0,0,0.15)',
                  color: 'white'
                }}
              >
                {/* Flèche précédent (jour ou mois selon le mode) */}
                {(viewMode === 'day' || viewMode === 'month') && (
                  <svg 
                    width="16" 
                    height="16" 
                    fill="none" 
                    viewBox="0 0 20 20" 
                    className="mr-2 cursor-pointer text-neutral-400 hover:text-blue-300 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (viewMode === 'day') {
                        handlePrevDay();
                      } else {
                        shiftMonth(-1);
                      }
                    }}
                  >
                    <path d="M13 16l-5-6 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                <CalendarIcon className="mr-2 h-4 w-4" />
                {calendarTriggerLabel(viewMode, selectedDate)}
                {(viewMode === 'day' || viewMode === 'month') && (
                  <svg 
                    width="16" 
                    height="16" 
                    fill="none" 
                    viewBox="0 0 20 20" 
                    className="ml-2 cursor-pointer text-neutral-400 hover:text-blue-300 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (viewMode === 'day') {
                        handleNextDay();
                      } else {
                        shiftMonth(1);
                      }
                    }}
                  >
                    <path d="M7 4l5 6-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </Button>
            </PopoverTrigger>
            {/* Bouton filtre — ouvre recherche + statut / chauffeur / client */}
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "flex-shrink-0 text-blue-400 hover:bg-white/10 transition-colors",
                isFiltersOpen && "border-blue-500/50 bg-white/10 text-blue-400"
              )}
              style={{
                background: isFiltersOpen ? 'rgba(255,255,255,0.10)' : 'rgba(12, 12, 14, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: isFiltersOpen ? '1.5px solid rgba(59, 130, 246, 0.5)' : '1.5px solid rgba(255,255,255,0.10)',
                boxShadow: '0 4px 16px 0 rgba(0,0,0,0.15)',
              }}
              onClick={() => setIsFiltersOpen(!isFiltersOpen)}
              aria-label="Afficher/masquer les filtres"
              aria-expanded={isFiltersOpen}
            >
              <FilterIcon className="h-4 w-4" />
            </Button>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] justify-start text-left font-normal z-50 isolate"
              align="start"
              side="bottom"
              sideOffset={4}
              style={{
                background: 'rgba(12, 12, 14, 0.35)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1.5px solid rgba(255,255,255,0.10)',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.6)',
                borderRadius: 8,
                padding: 0,
                isolation: 'isolate'
              }}
            >
              {/* Sélecteur d'année en haut, toggle jour/mois, puis grille unique */}
              <div className="flex flex-col gap-1 mb-1.5">
                {/* Sélecteur d'année (toujours visible en haut) */}
                <div className="flex items-center gap-0.5 justify-center mb-0 mt-0">
                  <button
                    type="button"
                    aria-label="Année précédente"
                    className="p-1 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                    onClick={(e) => {
                      shiftYear(-1)
                      e.currentTarget.blur()
                    }}
                  >
                    <span className="sr-only">Année précédente</span>
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="text-neutral-400"><path d="M13 16l-5-6 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                  <span className="font-semibold text-sm w-[60px] text-center select-none text-white drop-shadow-sm">{year}</span>
                  <button
                    type="button"
                    aria-label="Année suivante"
                    className="p-1 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                    onClick={(e) => {
                      shiftYear(1)
                      e.currentTarget.blur()
                    }}
                  >
                    <span className="sr-only">Année suivante</span>
                    <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="text-neutral-400"><path d="M7 4l5 6-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <div className="w-full flex justify-center gap-0.5 mb-0 px-0 py-0">
                  <button
                    type="button"
                    className={`cursor-pointer text-xs font-medium transition-colors duration-200 select-none px-1.5 ${viewMode === 'day' ? 'text-blue-600' : 'text-neutral-500 hover:text-blue-500'}`}
                    onClick={() => {
                      setViewMode('day');
                      if (selectedDate) {
                        handleDateChange(selectedDate);
                      }
                    }}
                  >
                    Jour
                  </button>
                  <button
                    type="button"
                    className={`cursor-pointer text-xs font-medium transition-colors duration-200 select-none px-1.5 ${viewMode === 'month' ? 'text-blue-600' : 'text-neutral-500 hover:text-blue-500'}`}
                    onClick={() => {
                      setViewMode('month');
                      if (selectedDate) {
                        const newDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                        setSelectedDate(newDate);
                      }
                    }}
                  >
                    Mois
                  </button>
                </div>
                {viewMode === 'day' && (
                  <div className="w-full mx-auto grid grid-cols-7 gap-x-0.5 px-2 mb-0.5">
                    {WEEKDAYS.map((dayName) => (
                      <div
                        key={dayName}
                        className="text-center text-xs font-medium text-neutral-400 py-0.5 select-none"
                      >
                        {dayName}
                      </div>
                    ))}
                  </div>
                )}
                
                <div
                  className={`w-full mx-auto grid ${viewMode === 'month' ? 'grid-cols-3 gap-x-2 gap-y-2' : 'grid-cols-7 gap-x-0.5 gap-y-1'} px-2 py-0.5 mb-1.5`}
                >
                  {viewMode === 'month'
                    ? MONTHS.map((m, idx) => {
                        const isSelected = isSameCalendarMonth(selectedDate, year, idx)
                        return (
                          <button
                            key={m}
                          className={`w-full min-w-[32px] py-1 rounded-md font-medium text-sm transition-colors duration-200 select-none
                            ${isSelected ? 'bg-blue-500/25 text-blue-200' : 'bg-transparent text-white hover:bg-blue-500/15 hover:text-blue-200'}`}
                            onClick={() => {
                              setMonth(idx);
                              const newDate = new Date(year, idx, 1);
                              setSelectedDate(newDate);
                            }}
                            type="button"
                          >
                            {m.charAt(0).toUpperCase() + m.slice(1)}
                          </button>
                        );
                      })
                    : dayCells.map((day, cellIndex) => {
                          if (day === null) {
                            const weekday = WEEKDAYS[cellIndex] ?? `w${cellIndex}`
                            return (
                              <div
                                key={`pad-${year}-${month}-${weekday}`}
                                className="w-full min-w-[32px] py-1"
                              />
                            );
                          }

                          const isSelected = isSameCalendarDay(
                            selectedDate,
                            year,
                            month,
                            day,
                          );
                          return (
                            <button
                              key={`day-${year}-${month}-${day}`}
                              className={`w-full min-w-[32px] py-1 rounded-md font-medium text-sm transition-colors duration-200 select-none ${isSelected ? 'bg-blue-500/25 text-blue-200' : 'bg-transparent text-white hover:bg-blue-500/15 hover:text-blue-200'}`}
                              onClick={() => {
                                const newDate = new Date(year, month, day);
                                setSelectedDate(newDate);
                              }}
                              type="button"
                            >
                              {day}
                            </button>
                          );
                        })
                  }
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Filtres avancés (recherche + selects) — uniquement si panneau ouvert */}
      <div
        className={cn(
          "mt-2 space-y-2 flex flex-col items-center md:items-stretch",
          !isFiltersOpen && "hidden",
        )}
      >
        <div className="relative w-[80vw] md:w-full">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none"
            aria-hidden
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher client, téléphone, adresse, #réf course…"
            className="pl-9 pr-9 h-10 bg-neutral-950/40 border-neutral-700/80 text-neutral-100 placeholder:text-neutral-500"
            aria-label="Rechercher une course"
          />
          {searchQuery ? (
            <button
              type="button"
              aria-label="Effacer la recherche"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded text-neutral-500 hover:text-neutral-200"
              onClick={() => setSearchQuery("")}
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-col md:flex-row gap-2 md:gap-4 w-[80vw] md:w-full items-center md:items-stretch">
          <Select value={selectedStatus} onValueChange={value => setSelectedStatus(value as any)}>
            <SelectTrigger
              className="w-full md:w-[200px] lg:w-[240px]"
              style={{
                background: 'rgba(12, 12, 14, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255,255,255,0.10)',
                boxShadow: '0 4px 16px 0 rgba(0,0,0,0.15)',
                color: 'white'
              }}
            >
              <ListFilterIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent
              style={{
                background: 'rgba(12, 12, 14, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255,255,255,0.10)',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)',
                color: 'white',
                borderRadius: '8px'
              }}
            >
              <SelectItem
                value="all"
                style={{ color: 'white' }}
                className="hover:bg-white/10 text-size-sm font-medium flex items-center gap-2"
              >
                <span className="text-white">Toutes les courses</span>
              </SelectItem>
              {ALL_UI_STATUSES.filter(status =>
                !['clientCanceled', 'driverCanceled', 'adminCanceled', 'unassigned'].includes(status)
              ).map((status) => (
                <SelectItem
                  key={status}
                  value={status === 'inProgress' ? 'in-progress' : status}
                  style={{ color: 'white' }}
                  className="hover:bg-white/10"
                >
                  <StatusBadge status={status} size="default" />
                </SelectItem>
              ))}
              <SelectItem
                value="canceled"
                style={{ color: 'white' }}
                className="hover:bg-white/10"
              >
                <StatusBadge status="clientCanceled" size="default" showDetailed={false} />
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={driverFilter || "all"}
            onValueChange={value => setDriverFilter(value === "all" ? null : value)}
          >
            <SelectTrigger
              className="w-full md:w-[200px] lg:w-[240px]"
              style={{
                background: 'rgba(12, 12, 14, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255,255,255,0.10)',
                boxShadow: '0 4px 16px 0 rgba(0,0,0,0.15)',
                color: 'white'
              }}
            >
              <UserIcon className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Chauffeur" />
            </SelectTrigger>
            <SelectContent
              style={{
                background: 'rgba(12, 12, 14, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255,255,255,0.10)',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)',
                color: 'white',
                borderRadius: '8px'
              }}
            >
              <SelectItem value="all" style={{ color: 'white' }} className="hover:bg-white/10">Tous les chauffeurs</SelectItem>
              {drivers.map((driver) => (
                <SelectItem key={driver.id} value={driver.id} style={{ color: 'white' }} className="hover:bg-white/10">
                  {driver.first_name} {driver.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={clientFilter || "all"}
            onValueChange={value => setClientFilter(value === "all" ? null : value)}
          >
            <SelectTrigger
              className="w-full md:w-[200px] lg:w-[240px]"
              style={{
                background: 'rgba(12, 12, 14, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255,255,255,0.10)',
                boxShadow: '0 4px 16px 0 rgba(0,0,0,0.15)',
                color: 'white'
              }}
            >
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Client" />
            </SelectTrigger>
            <SelectContent
              style={{
                background: 'rgba(12, 12, 14, 0.25)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1.5px solid rgba(255,255,255,0.10)',
                boxShadow: '0 8px 32px 0 rgba(0,0,0,0.25)',
                color: 'white',
                borderRadius: '8px'
              }}
            >
              <SelectItem value="all" style={{ color: 'white' }} className="hover:bg-white/10">Tous les clients</SelectItem>
              {clientOptions.map((client) => (
                <SelectItem key={client.id} value={client.id} style={{ color: 'white' }} className="hover:bg-white/10">
                  {client.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  )
}
