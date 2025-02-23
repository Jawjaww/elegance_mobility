"use client"

import { useRunsStore } from "@/lib/stores/runsStore"
import { RideCard } from "./RideCard"
import { format, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { useEffect } from "react"

export function RideList() {
  const { runs, selectedDate, fetchRuns, isLoading } = useRunsStore()

  // Charger les courses au montage et quand la date change
  useEffect(() => {
    fetchRuns(selectedDate)
  }, [selectedDate, fetchRuns])

  // Filtrer les courses pour la date sélectionnée
  const filteredRuns = runs.filter((run) =>
    isSameDay(new Date(run.time_window_start), selectedDate)
  )

  // Trier les courses par heure de début
  const sortedRuns = [...filteredRuns].sort(
    (a, b) => 
      new Date(a.time_window_start).getTime() - new Date(b.time_window_start).getTime()
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-neutral-200 border-t-neutral-800" />
      </div>
    )
  }

  if (filteredRuns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <p className="text-lg font-medium text-neutral-100">
          Aucune course pour le{" "}
          {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
        </p>
        <p className="mt-2 text-sm text-neutral-400">
          Sélectionnez une autre date ou créez une nouvelle course
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sortedRuns.map((run) => (
          <RideCard
            key={run.id}
            run={run}
            onClick={(run) => {
              // TODO: Ouvrir le dialogue de détails de la course
              console.log("Clicked run:", run)
            }}
          />
        ))}
      </div>
    </div>
  )
}