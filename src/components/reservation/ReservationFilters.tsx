"use client";

import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import {
  ALL_UI_STATUSES,
  STATUS_LABELS,
  type UiStatus,
} from "@/lib/services/statusService";
import { StatusBadge } from "./StatusBadge";

type FilterStatus = UiStatus | "all";

const ALL_FILTER_STATUSES = ["all", ...ALL_UI_STATUSES] as const;

interface ReservationFiltersProps {
  onFilterChange: (filters: {
    status?: string;
    startDate?: Date;
    endDate?: Date;
  }) => void;
}

export function ReservationFilters({
  onFilterChange,
}: ReservationFiltersProps) {
  // Mode d'affichage : 'day' ou 'month'
  const [viewMode, setViewMode] = useState<'day' | 'month'>('month');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [month, setMonth] = useState<number>((selectedDate || new Date()).getMonth());
  const [year, setYear] = useState<number>((selectedDate || new Date()).getFullYear());
  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);
  const months = [
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
  ];

  // Navigation rapide jour précédent/suivant (hors calendrier, mode jour uniquement)
  const handlePrevDay = () => {
    if (viewMode !== 'day' || !selectedDate) return;
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
    setMonth(prevDay.getMonth());
    setYear(prevDay.getFullYear());
    const start = new Date(prevDay.getFullYear(), prevDay.getMonth(), prevDay.getDate(), 0, 0, 0, 0);
    const end = new Date(prevDay.getFullYear(), prevDay.getMonth(), prevDay.getDate(), 23, 59, 59, 999);
    onFilterChange({ startDate: start, endDate: end });
  };

  const handleNextDay = () => {
    if (viewMode !== 'day' || !selectedDate) return;
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
    setMonth(nextDay.getMonth());
    setYear(nextDay.getFullYear());
    const start = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 0, 0, 0, 0);
    const end = new Date(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate(), 23, 59, 59, 999);
    onFilterChange({ startDate: start, endDate: end });
  };

  // Ancienne gestion mois/année supprimée car remplacée par la nouvelle UX

  // Sélection d'une date précise (mode jour)
  const handleDateChange = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      if (viewMode === 'day') {
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
        onFilterChange({ startDate: start, endDate: end });
      } else {
        // en mode mois, cliquer sur un jour bascule en mode jour
        setViewMode('day');
        setSelectedDate(date);
        setMonth(date.getMonth());
        setYear(date.getFullYear());
        const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
        const end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
        onFilterChange({ startDate: start, endDate: end });
      }
    }
  };

  const [selectedStatus, setSelectedStatus] = useState<FilterStatus>("all");

  const handleStatusChange = (value: FilterStatus) => {
    setSelectedStatus(value);
    onFilterChange({ status: value });
  };

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-1 items-center w-full pt-2 pb-2">
      <div className="flex items-center gap-2 w-full sm:flex-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-start text-left font-normal"
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
                      // Navigation mois précédent
                      const prevMonth = month === 0 ? 11 : month - 1;
                      const prevYear = month === 0 ? year - 1 : year;
                      setMonth(prevMonth);
                      setYear(prevYear);
                      const newDate = new Date(prevYear, prevMonth, 1);
                      setSelectedDate(newDate);
                      const start = new Date(prevYear, prevMonth, 1);
                      const end = new Date(prevYear, prevMonth + 1, 0, 23, 59, 59, 999);
                      onFilterChange({ startDate: start, endDate: end });
                    }
                  }}
                >
                  <path d="M13 16l-5-6 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              <CalendarIcon className="mr-2 h-4 w-4" />
              {viewMode === 'month' && selectedDate ? (
                `${format(selectedDate, "MMMM yyyy", { locale: fr })}`
              ) : viewMode === 'day' && selectedDate ? (
                `${format(selectedDate, "PPPP", { locale: fr })}`
              ) : (
                <span>Sélectionner une date ou un mois</span>
              )}
              {/* Flèche suivant (jour ou mois selon le mode) */}
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
                      // Navigation mois suivant
                      const nextMonth = month === 11 ? 0 : month + 1;
                      const nextYear = month === 11 ? year + 1 : year;
                      setMonth(nextMonth);
                      setYear(nextYear);
                      const newDate = new Date(nextYear, nextMonth, 1);
                      setSelectedDate(newDate);
                      const start = new Date(nextYear, nextMonth, 1);
                      const end = new Date(nextYear, nextMonth + 1, 0, 23, 59, 59, 999);
                      onFilterChange({ startDate: start, endDate: end });
                    }
                  }}
                >
                  <path d="M7 4l5 6-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </Button>
          </PopoverTrigger>
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
                  onClick={e => {
                    const newYear = year - 1;
                    setYear(newYear);
                    if (viewMode === 'month') {
                      const start = new Date(newYear, month, 1);
                      const end = new Date(newYear, month + 1, 0, 23, 59, 59, 999);
                      setSelectedDate(new Date(newYear, month, 1));
                      onFilterChange({ startDate: start, endDate: end });
                    } else if (viewMode === 'day' && selectedDate) {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(newYear);
                      setSelectedDate(newDate);
                      setMonth(newDate.getMonth());
                      const start = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0, 0);
                      const end = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 23, 59, 59, 999);
                      onFilterChange({ startDate: start, endDate: end });
                    }
                    e.currentTarget.blur();
                  }}
                >
                  <span className="sr-only">Année précédente</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="text-neutral-400"><path d="M13 16l-5-6 5-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {/* Affichage de l'année sélectionnée avec taille de police réduite */}
                <span className="font-semibold text-sm w-[60px] text-center select-none text-white drop-shadow-sm">{year}</span>
                <button
                  type="button"
                  aria-label="Année suivante"
                  className="p-1 rounded-full hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                  onClick={e => {
                    const newYear = year + 1;
                    setYear(newYear);
                    if (viewMode === 'month') {
                      const start = new Date(newYear, month, 1);
                      const end = new Date(newYear, month + 1, 0, 23, 59, 59, 999);
                      setSelectedDate(new Date(newYear, month, 1));
                      onFilterChange({ startDate: start, endDate: end });
                    } else if (viewMode === 'day' && selectedDate) {
                      const newDate = new Date(selectedDate);
                      newDate.setFullYear(newYear);
                      setSelectedDate(newDate);
                      setMonth(newDate.getMonth());
                      const start = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0, 0);
                      const end = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 23, 59, 59, 999);
                      onFilterChange({ startDate: start, endDate: end });
                    }
                    e.currentTarget.blur();
                  }}
                >
                  <span className="sr-only">Année suivante</span>
                  <svg width="20" height="20" fill="none" viewBox="0 0 20 20" className="text-neutral-400"><path d="M7 4l5 6-5 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              {/* Ligne Jour/Mois transparente */}
              <div className="w-full flex justify-center gap-0.5 mb-0 px-0 py-0">
                <span
                  className={`cursor-pointer text-xs font-medium transition-colors duration-200 select-none px-1.5 ${viewMode === 'day' ? 'text-blue-600' : 'text-neutral-500 hover:text-blue-500'}`}
                  onClick={() => {
                    setViewMode('day');
                    if (selectedDate) {
                      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 0, 0, 0, 0);
                      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(), 23, 59, 59, 999);
                      onFilterChange({ startDate: start, endDate: end });
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewMode('day'); } }}
                >
                  Jour
                </span>
                <span
                  className={`cursor-pointer text-xs font-medium transition-colors duration-200 select-none px-1.5 ${viewMode === 'month' ? 'text-blue-600' : 'text-neutral-500 hover:text-blue-500'}`}
                  onClick={() => {
                    setViewMode('month');
                    if (selectedDate) {
                      const start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                      const end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
                      onFilterChange({ startDate: start, endDate: end });
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setViewMode('month'); } }}
                >
                  Mois
                </span>
              </div>
              {/* En-tête des jours de la semaine (uniquement en mode jour) */}
              {viewMode === 'day' && (
                <div className="w-full mx-auto grid grid-cols-7 gap-x-0.5 px-2 mb-0.5">
                  {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((dayName) => (
                    <div
                      key={dayName}
                      className="text-center text-xs font-medium text-neutral-400 py-0.5 select-none"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>
              )}
              
              {/* Grille factorisée pour jours/mois */}
              <div
                className={`w-full mx-auto grid ${viewMode === 'month' ? 'grid-cols-3 gap-x-2 gap-y-2' : 'grid-cols-7 gap-x-0.5 gap-y-1'} px-2 py-0.5 mb-1.5`}
              >
                {viewMode === 'month'
                  ? months.map((m, idx) => {
                      const isSelected = month === idx && selectedDate && selectedDate.getFullYear() === year;
                      return (
                        <button
                          key={m}
                        className={`w-full min-w-[32px] py-1 rounded-md font-medium text-sm transition-colors duration-200 select-none
                          ${isSelected ? 'bg-blue-500/25 text-blue-200' : 'bg-transparent text-white hover:bg-blue-500/15 hover:text-blue-200'}`}
                          onClick={() => {
                            setMonth(idx);
                            const newDate = new Date(year, idx, 1);
                            setSelectedDate(newDate);
                            const start = new Date(year, idx, 1);
                            const end = new Date(year, idx + 1, 0, 23, 59, 59, 999);
                            onFilterChange({ startDate: start, endDate: end });
                          }}
                          type="button"
                        >
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </button>
                      );
                    })
                  : (() => {
                      // Générer les jours du mois courant avec positionnement correct
                      const firstDayOfMonth = new Date(year, month, 1);
                      const lastDayOfMonth = new Date(year, month + 1, 0);
                      const daysInMonth = lastDayOfMonth.getDate();
                      
                      // Calculer le jour de la semaine du premier jour (0 = dimanche, 1 = lundi, etc.)
                      // Convertir pour que lundi = 0, dimanche = 6
                      const firstDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7;
                      
                      // Créer un tableau avec les espaces vides au début + les jours du mois
                      const calendarDays = [];
                      
                      // Ajouter les espaces vides pour les jours précédents
                      for (let i = 0; i < firstDayOfWeek; i++) {
                        calendarDays.push(null);
                      }
                      
                      // Ajouter les jours du mois
                      for (let day = 1; day <= daysInMonth; day++) {
                        calendarDays.push(day);
                      }
                      
                      return calendarDays.map((day, index) => {
                        if (day === null) {
                          // Cellule vide pour les jours précédents
                          return <div key={`empty-${index}`} className="w-full min-w-[32px] py-1"></div>;
                        }
                        
                        const isSelected = selectedDate &&
                          selectedDate.getFullYear() === year &&
                          selectedDate.getMonth() === month &&
                          selectedDate.getDate() === day;
                        return (
                          <button
                            key={day}
                            className={`w-full min-w-[32px] py-1 rounded-md font-medium text-sm transition-colors duration-200 select-none ${isSelected ? 'bg-blue-500/25 text-blue-200' : 'bg-transparent text-white hover:bg-blue-500/15 hover:text-blue-200'}`}
                            onClick={() => {
                              const newDate = new Date(year, month, day);
                              setSelectedDate(newDate);
                              const start = new Date(year, month, day, 0, 0, 0, 0);
                              const end = new Date(year, month, day, 23, 59, 59, 999);
                              onFilterChange({ startDate: start, endDate: end });
                            }}
                            type="button"
                          >
                            {day}
                          </button>
                        );
                      });
                    })()
                }
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <Select value={selectedStatus} onValueChange={handleStatusChange}>
        <SelectTrigger 
          className="w-full sm:w-[200px] lg:w-[240px]"
          style={{
            background: 'rgba(12, 12, 14, 0.25)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1.5px solid rgba(255,255,255,0.10)',
            boxShadow: '0 4px 16px 0 rgba(0,0,0,0.15)',
            color: 'white'
          }}
        >
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
                    <span className="text-white">Tous les statuts</span>
                  </SelectItem>
                  {ALL_UI_STATUSES.filter(status => 
                    !['clientCanceled', 'driverCanceled', 'adminCanceled'].includes(status)
                  ).map((status) => (
                    <SelectItem 
                      key={status}
                      value={status}
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
    </div>
  );
}
