import { create } from 'zustand'
import { PricingService } from '../services/pricingService'
import { VehicleType } from '../types'

interface ValidatedAddress {
  lat: number;
  lon: number;
  display_name: string;
}

interface ReservationState {
  // Données de base
  departure: ValidatedAddress | null
  destination: ValidatedAddress | null
  selectedVehicle: VehicleType
  selectedOptions: string[]
  distance: number | null
  duration: number | null
  pickupDateTime: Date

  // État
  isInitialized: boolean
  error: string | null

  // Getters
  getPriceDetails: () => {
    base: number
    distance: number
    options: number
    total: number
  } | null

  // Actions
  setPickup: (address: { lat: number; lon: number; display_name: string }) => void
  setDropoff: (address: { lat: number; lon: number; display_name: string }) => void
  setVehicleType: (type: VehicleType) => void
  toggleOption: (optionId: string) => void
  setDistance: (km: number) => void
  setSelectedOptions: (options: string[]) => void
  initialize: () => Promise<void>
  loadFromStorage: () => void
  saveToStorage: () => void
  reset: () => void
}

const STORAGE_KEY = 'reservation_data'

export const useReservationStore = create<ReservationState>((set, get) => ({
  // État initial
  departure: null,
  destination: null,
  selectedVehicle: 'STANDARD' as VehicleType,
  selectedOptions: [],
  distance: null,
  duration: null,
  pickupDateTime: new Date(Date.now() + 30 * 60000), // 30 minutes from now
  isInitialized: false,
  error: null,

  // Getters
  getPriceDetails: () => {
    const state = get()
    if (!state.selectedVehicle || !state.distance) {
      return null
    }

    try {
      return PricingService.calculatePrice({
        vehicleType: state.selectedVehicle,
        distanceKm: state.distance,
        selectedOptions: state.selectedOptions
      })
    } catch (error) {
      console.error('Erreur lors du calcul du prix:', error)
      return null
    }
  },

  // Actions
  setPickup: (address) => {
    set({ departure: address })
    get().saveToStorage()
  },

  setDropoff: (address) => {
    set({ destination: address })
    get().saveToStorage()
  },

  setVehicleType: (type) => {
    set({ selectedVehicle: type })
    get().saveToStorage()
  },

  toggleOption: (optionId) => {
    set(state => ({
      selectedOptions: state.selectedOptions.includes(optionId)
        ? state.selectedOptions.filter(id => id !== optionId)
        : [...state.selectedOptions, optionId]
    }))
    get().saveToStorage()
  },

  setDistance: (km) => {
    set({ distance: km })
    get().saveToStorage()
  },

  setDuration: (minutes) => {
    set({ duration: minutes })
    get().saveToStorage()
  },

  setPickupDateTime: (date) => {
    set({ pickupDateTime: date })
    get().saveToStorage()
  },

  setSelectedOptions: (options) => {
    set({ selectedOptions: options })
    get().saveToStorage()
  },

  initialize: async () => {
    if (get().isInitialized) {
      return
    }

    try {
      await PricingService.initialize()
      get().loadFromStorage()
      set({ isInitialized: true, error: null })
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erreur lors de l\'initialisation',
        isInitialized: false 
      })
    }
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored)
        set({
          departure: data.departure,
          destination: data.destination,
          selectedVehicle: data.selectedVehicle,
          selectedOptions: data.selectedOptions,
          distance: data.distance,
          duration: data.duration,
          pickupDateTime: data.pickupDateTime ? new Date(data.pickupDateTime) : new Date(Date.now() + 30 * 60000)
        })
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error)
    }
  },

  saveToStorage: () => {
    try {
      const state = get()
      const data = {
        departure: state.departure,
        destination: state.destination,
        selectedVehicle: state.selectedVehicle,
        selectedOptions: state.selectedOptions,
        distance: state.distance,
        duration: state.duration,
        pickupDateTime: state.pickupDateTime.toISOString()
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Erreur lors de la sauvegarde des données:', error)
    }
  },

  reset: () => {
    set({
      departure: null,
      destination: null,
      selectedVehicle: 'STANDARD' as VehicleType,
      selectedOptions: [],
      distance: null,
      duration: null,
      pickupDateTime: new Date(Date.now() + 30 * 60000)
    })
    localStorage.removeItem(STORAGE_KEY)
  }
}))