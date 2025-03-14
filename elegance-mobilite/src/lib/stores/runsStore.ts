import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { supabase } from "@/lib/supabaseClient"
import { useEffect } from "react"

export type DeliveryRun = {
  id: string
  status: "pending" | "assigned" | "in_progress" | "completed" | "canceled"
  customer_name: string
  customer_phone?: string
  customer_email?: string
  delivery_address: string
  delivery_notes?: string
  time_window_start: Date
  time_window_end: Date
  assigned_driver_id?: string
  vehicle_id?: string
  created_at: Date
  updated_at: Date
}

type RunsState = {
  runs: DeliveryRun[]
  selectedDate: Date
  isLoading: boolean
  error: string | null
  // Actions
  setSelectedDate: (date: Date) => void
  fetchRuns: (date: Date) => Promise<void>
  updateRunStatus: (runId: string, status: DeliveryRun["status"]) => Promise<void>
  assignDriver: (runId: string, driverId: string) => Promise<void>
}

export const useRunsStore = create<RunsState>()(
  devtools(
    (set, get) => ({
      runs: [],
      selectedDate: new Date(),
      isLoading: false,
      error: null,

      setSelectedDate: (date) => {
        set({ selectedDate: date })
        get().fetchRuns(date)
      },

      fetchRuns: async (date) => {
        set({ isLoading: true, error: null })
        try {
          const startOfDay = new Date(date)
          startOfDay.setHours(0, 0, 0, 0)
          
          const endOfDay = new Date(date)
          endOfDay.setHours(23, 59, 59, 999)

          const { data, error } = await supabase
            .from("courses")
            .select("*")
            .gte("time_window_start", startOfDay.toISOString())
            .lte("time_window_start", endOfDay.toISOString())
            .order("time_window_start", { ascending: true })

          if (error) throw error

          set({
            runs: data.map((run: DeliveryRun & { time_window_start: string; time_window_end: string; created_at: string; updated_at: string }) => ({
              ...run,
              time_window_start: new Date(run.time_window_start),
              time_window_end: new Date(run.time_window_end),
              created_at: new Date(run.created_at),
              updated_at: new Date(run.updated_at),
            })),
            isLoading: false
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Une erreur est survenue",
            isLoading: false
          })
        }
      },

      updateRunStatus: async (runId, status) => {
        try {
          const { error } = await supabase
            .from("courses")
            .update({ status })
            .eq("id", runId)

          if (error) throw error

          // Optimistic update
          set(state => ({
            runs: state.runs.map(run =>
              run.id === runId ? { ...run, status } : run
            )
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Impossible de mettre à jour le statut"
          })
        }
      },

      assignDriver: async (runId, driverId) => {
        try {
          // Récupérer d'abord le véhicule par défaut du chauffeur
          const { data: driverData, error: driverError } = await supabase
            .from("drivers")
            .select("default_vehicle_id")
            .eq("id", driverId)
            .single()

          if (driverError) throw driverError

          const { error } = await supabase
            .from("courses")
            .update({
              assigned_driver_id: driverId,
              vehicle_id: driverData.default_vehicle_id,
              status: "assigned"
            })
            .eq("id", runId)

          if (error) throw error

          // Optimistic update
          set(state => ({
            runs: state.runs.map(run =>
              run.id === runId
                ? {
                    ...run,
                    assigned_driver_id: driverId,
                    vehicle_id: driverData.default_vehicle_id,
                    status: "assigned"
                  }
                : run
            )
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : "Impossible d'assigner le chauffeur"
          })
        }
      }
    }),
    { name: "runs-store" }
  )
)

// Hook pour les mises à jour en temps réel
export const useRealtimeRuns = () => {
  const fetchRuns = useRunsStore(state => state.fetchRuns)
  const selectedDate = useRunsStore(state => state.selectedDate)

  useEffect(() => {
    const channel = supabase
      .channel("courses-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "courses"
        },
        () => {
          // Recharger les courses à chaque changement
          fetchRuns(selectedDate)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRuns, selectedDate])
}