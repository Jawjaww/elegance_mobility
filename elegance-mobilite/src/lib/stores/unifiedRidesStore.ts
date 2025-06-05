import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from "@/lib/types/database.types"

type DatabaseRide = Database['public']['Tables']['rides']['Row']
type DatabaseDriver = Database['public']['Tables']['drivers']['Row']
type RideStatus = Database['public']['Enums']['ride_status']

type RideWithDriver = DatabaseRide & {
  driver: DatabaseDriver | null
}

type FilterStatus = RideStatus | 'all'

interface RidesState {
  // État
  rides: RideWithDriver[]
  filteredRides: RideWithDriver[]
  selectedDate: Date
  selectedStatus: FilterStatus
  driverFilter: string | null
  clientFilter: string | null
  viewMode: 'day' | 'month'
  loading: boolean
  error: string | null
  
  // Actions
  fetchRides: () => Promise<void>
  setSelectedDate: (date: Date) => void
  setSelectedStatus: (status: FilterStatus) => void
  setDriverFilter: (driverId: string | null) => void
  setClientFilter: (clientId: string | null) => void
  setViewMode: (mode: 'day' | 'month') => void
  updateRideStatus: (rideId: string, status: RideStatus) => Promise<void>
  assignDriver: (rideId: string, driverId: string) => Promise<void>
  deleteRide: (rideId: string) => Promise<void>
}

const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

const applyFilters = (
  rides: RideWithDriver[],
  selectedDate: Date,
  selectedStatus: FilterStatus,
  driverFilter: string | null,
  viewMode: 'day' | 'month',
  clientFilter: string | null
): RideWithDriver[] => {
  let start: Date, end: Date;
  if (viewMode === 'month') {
    start = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0, 23, 59, 59, 999);
  } else {
    start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
  }

  return rides.filter(ride => {
    const rideDate = new Date(ride.pickup_time)
    const matchesDate = rideDate >= start && rideDate <= end

    let matchesStatus = true
    if (selectedStatus !== 'all') {
      matchesStatus = ride.status === selectedStatus
    }

    const matchesDriver = !driverFilter || ride.driver_id === driverFilter
    const matchesClient = !clientFilter || ride.user_id === clientFilter

    return matchesDate && matchesStatus && matchesDriver && matchesClient
  })
}

export const useUnifiedRidesStore = create<RidesState>()(
  devtools(
    (set, get) => ({
      rides: [],
      filteredRides: [],
      selectedDate: new Date(),
      selectedStatus: 'all',
      driverFilter: null,
      clientFilter: null,
      viewMode: 'month',
      loading: false,
      error: null,

      fetchRides: async () => {
        set({ loading: true, error: null })
        try {
          const supabase = createClient()
          const { data, error } = await supabase
            .from('rides')
            .select(`
              *,
              driver:drivers(*)
            `)
            .order('pickup_time', { ascending: true })

          if (error) throw error

          const rides = data.map(ride => ({
            ...ride,
            driver: ride.driver as DatabaseDriver | null
          }))

          const { selectedDate, selectedStatus, driverFilter, viewMode, clientFilter } = get()
          const filteredRides = applyFilters(rides, selectedDate, selectedStatus, driverFilter, viewMode, clientFilter)

          set({
            rides,
            filteredRides,
            loading: false
          })
        } catch (error: any) {
          console.error('Erreur lors de la récupération des courses:', error)
          set({
            error: error.message || 'Erreur lors de la récupération des courses',
            loading: false
          })
        }
      },

      setSelectedDate: (date) => {
        const { rides, selectedStatus, driverFilter, viewMode, clientFilter } = get()
        const filteredRides = applyFilters(rides, date, selectedStatus, driverFilter, viewMode, clientFilter)
        set({ selectedDate: date, filteredRides })
      },

      setSelectedStatus: (status) => {
        const { rides, selectedDate, driverFilter, viewMode, clientFilter } = get()
        const filteredRides = applyFilters(rides, selectedDate, status, driverFilter, viewMode, clientFilter)
        set({ selectedStatus: status, filteredRides })
      },

      setDriverFilter: (driverId) => {
        const { rides, selectedDate, selectedStatus, viewMode, clientFilter } = get()
        const filteredRides = applyFilters(rides, selectedDate, selectedStatus, driverId, viewMode, clientFilter)
        set({ driverFilter: driverId, filteredRides })
      },

      setClientFilter: (clientId) => {
        const { rides, selectedDate, selectedStatus, driverFilter, viewMode } = get()
        const filteredRides = applyFilters(rides, selectedDate, selectedStatus, driverFilter, viewMode, clientId)
        set({ clientFilter: clientId, filteredRides })
      },

      setViewMode: (mode) => {
        const { rides, selectedDate, selectedStatus, driverFilter, clientFilter } = get()
        const filteredRides = applyFilters(rides, selectedDate, selectedStatus, driverFilter, mode, clientFilter)
        set({ viewMode: mode, filteredRides })
      },

      updateRideStatus: async (rideId, status) => {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('rides')
            .update({ 
              status,
              updated_at: new Date().toISOString()
            })
            .eq('id', rideId)

          if (error) throw error

          const updateRide = (rides: RideWithDriver[]): RideWithDriver[] =>
            rides.map(ride =>
              ride.id === rideId
                ? { ...ride, status, updated_at: new Date().toISOString() }
                : ride
            )

          const updatedRides = updateRide(get().rides)
          const { selectedDate, selectedStatus, driverFilter, viewMode, clientFilter } = get()
          const filteredRides = applyFilters(updatedRides, selectedDate, selectedStatus, driverFilter, viewMode, clientFilter)

          set({
            rides: updatedRides,
            filteredRides
          })
        } catch (error: any) {
          console.error('Erreur lors de la mise à jour du statut:', error)
          set({ error: error.message || 'Erreur lors de la mise à jour du statut' })
        }
      },

      assignDriver: async (rideId, driverId) => {
        try {
          const supabase = createClient()
          const newStatus: RideStatus = 'scheduled'
          
          const { error } = await supabase
            .from('rides')
            .update({
              driver_id: driverId,
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', rideId)

          if (error) throw error

          const { data: driver, error: driverError } = await supabase
            .from('drivers')
            .select('*')
            .eq('id', driverId)
            .single()

          if (driverError) throw driverError

          const updateRide = (rides: RideWithDriver[]): RideWithDriver[] =>
            rides.map(ride =>
              ride.id === rideId
                ? {
                    ...ride,
                    driver_id: driverId,
                    driver: driver as DatabaseDriver,
                    status: newStatus,
                    updated_at: new Date().toISOString()
                  }
                : ride
            )

          const updatedRides = updateRide(get().rides)
          const { selectedDate, selectedStatus, driverFilter, viewMode, clientFilter } = get()
          const filteredRides = applyFilters(updatedRides, selectedDate, selectedStatus, driverFilter, viewMode, clientFilter)

          set({
            rides: updatedRides,
            filteredRides
          })
        } catch (error: any) {
          console.error('Erreur lors de l\'assignation du chauffeur:', error)
          set({ error: error.message || 'Erreur lors de l\'assignation du chauffeur' })
        }
      },

      deleteRide: async (rideId) => {
        try {
          const supabase = createClient()
          const { error } = await supabase
            .from('rides')
            .delete()
            .eq('id', rideId)

          if (error) throw error

          const updatedRides = get().rides.filter(ride => ride.id !== rideId)
          const { selectedDate, selectedStatus, driverFilter, viewMode, clientFilter } = get()
          const filteredRides = applyFilters(updatedRides, selectedDate, selectedStatus, driverFilter, viewMode, clientFilter)

          set({
            rides: updatedRides,
            filteredRides
          })
        } catch (error: any) {
          console.error('Erreur lors de la suppression:', error)
          set({ error: error.message || 'Erreur lors de la suppression' })
          get().fetchRides()
        }
      }
    }),
    { name: "unified-rides-store" }
  )
)

// Setup des souscriptions en temps réel
if (typeof window !== 'undefined') {
  const supabase = createClient()
  
  supabase
    .channel('rides-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rides'
      },
      () => {
        useUnifiedRidesStore.getState().fetchRides()
      }
    )
    .subscribe()
}

export default useUnifiedRidesStore
