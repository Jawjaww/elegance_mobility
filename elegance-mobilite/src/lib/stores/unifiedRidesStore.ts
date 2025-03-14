import { create } from 'zustand'
import { useRidesStore } from '../ridesStore'
import { useDriversStore } from '../driversStore'

type RideStatus = 'all' | 'pending' | 'in-progress' | 'completed' | 'canceled' | 'unassigned'

interface UnifiedRidesStore {
  // Filtres
  selectedDate: Date
  selectedStatus: RideStatus
  driverFilter: string | null
  vehicleFilter: string | null

  // Actions
  setSelectedDate: (date: Date) => void
  setSelectedStatus: (status: RideStatus) => void
  setDriverFilter: (driverId: string | null) => void
  setVehicleFilter: (vehicleId: string | null) => void
  
  // Getters
  getFilteredRides: () => any[]
}

export const useUnifiedRidesStore = create<UnifiedRidesStore>((set, get) => ({
  selectedDate: new Date(),
  selectedStatus: 'all',
  driverFilter: 'all',
  vehicleFilter: null,

  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedStatus: (status) => set({ selectedStatus: status }),
  setDriverFilter: (driverId) => set({ driverFilter: driverId }),
  setVehicleFilter: (vehicleId) => set({ vehicleFilter: vehicleId }),

  getFilteredRides: () => {
    const { rides } = useRidesStore.getState()
    const { selectedDate, selectedStatus, driverFilter, vehicleFilter } = get()

    // Filtrer par date
    let filteredRides = rides.filter(ride => {
      const rideDate = new Date(ride.createdAt)
      return rideDate.toDateString() === selectedDate.toDateString()
    })

    // Filtrer par statut
    if (selectedStatus !== 'all') {
      if (selectedStatus === 'unassigned') {
        filteredRides = filteredRides.filter(ride => !ride.driverId)
      } else {
        filteredRides = filteredRides.filter(ride => ride.status === selectedStatus)
      }
    }

    // Filtrer par chauffeur
    if (driverFilter) {
      filteredRides = filteredRides.filter(ride => ride.driverId === driverFilter)
    }

    // Filtrer par véhicule (à implémenter quand le store des véhicules sera créé)
    if (vehicleFilter) {
      filteredRides = filteredRides.filter(ride => {
        const driver = useDriversStore.getState().drivers.find(d => d.id === ride.driverId)
        return driver?.current_vehicle === vehicleFilter
      })
    }

    return filteredRides
  }
}))
