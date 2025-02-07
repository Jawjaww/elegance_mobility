import { create } from 'zustand'
import { supabase } from './supabaseClient'
import type { VehicleCategory, CreateVehicleCategory } from './types'

interface RateData {
  id: string
  type: string
  base_rate: number
  peak_rate?: number
  night_rate?: number
  off_peak_rate?: number
}

// Constants for error messages
const ERROR_MESSAGES = {
  FETCH: 'Erreur lors de la récupération des tarifs',
  CREATE: 'Erreur lors de la création du tarif',
  UPDATE: 'Erreur lors de la mise à jour du tarif',
  DELETE: 'Erreur lors de la suppression du tarif',
  UNKNOWN: 'Une erreur inconnue est survenue'
}

interface RatesStore {
  rates: VehicleCategory[]
  loading: boolean
  error: string | null
  fetchRates: () => Promise<void>
  initialize: () => Promise<void>
  createRate: (rate: CreateVehicleCategory) => Promise<void>
  updateRate: (id: string, newRate: Partial<VehicleCategory>) => Promise<void>
  deleteRate: (id: string) => Promise<void>
  isInitialized: boolean
}

export const useRatesStore = create<RatesStore>((set) => ({
  rates: [],
  loading: false,
  error: null,
  isInitialized: false,

  fetchRates: async () => {
    try {
      set({ loading: true, error: null })
      
      const { data, error } = await supabase
        .from('rates')
        .select('*')
        .order('type', { ascending: true })

      if (error) throw error

      console.log('Raw rates data:', data)
      
      const newRates = transformRates(data)
      
      console.log('Transformed rates:', newRates)

      if (!newRates) {
        set({ loading: false, error: ERROR_MESSAGES.FETCH })
        return
      }

      set(state => {
        if (!state.rates || JSON.stringify(state.rates) !== JSON.stringify(newRates)) {
          return { rates: newRates, loading: false }
        }
        return { loading: false }
      })
    } catch (error: unknown) {
      set({
        error: error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN,
        loading: false
      })
    }
  },

  initialize: async () => {
    try {
      console.log('Initializing rates store...')
      const { fetchRates } = useRatesStore.getState()
      await fetchRates()
      set({ isInitialized: true })
      console.log('Rates store initialized successfully')
    } catch (error) {
      console.error('Error initializing rates store:', error)
      throw error
    }
  },

  createRate: async (rate) => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('rates')
        .insert({
          type: rate.type,
          base_rate: rate.baseRate,
          peak_rate: rate.peakRate,
          night_rate: rate.nightRate
        })
        .select()
        .single()

      if (error) throw error

      set(state => ({
        rates: [data, ...(state.rates || [])],
        loading: false
      }))
    } catch (error: unknown) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false 
      })
    }
  },

  updateRate: async (id, newRate) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('rates')
        .update({
          base_rate: newRate.baseRate,
          peak_rate: newRate.peakRate,
          night_rate: newRate.nightRate
        })
        .eq('id', id)

      if (error) throw error

      set(state => ({
        rates: state.rates.map(rate => 
          rate.id === id ? { ...rate, ...newRate } : rate
        ),
        loading: false
      }))
    } catch (error: unknown) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false 
      })
    }
  },

  deleteRate: async (id) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('rates')
        .delete()
        .eq('id', id)

      if (error) throw error

      set(state => ({
        rates: state.rates.filter(rate => rate.id !== id),
        loading: false
      }))
    } catch (error: unknown) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false 
      })
    }
  }
}))

// Optimisation : Améliorer l'efficacité du traitement des données
const transformRates = (rawRates: RateData[]) => {
  return rawRates.map(rate => ({
    id: rate.id,
    type: rate.type as VehicleCategory['type'],
    baseRate: rate.base_rate || rate.off_peak_rate || 0,
    peakRate: rate.peak_rate || 0,
    nightRate: rate.night_rate || 0
  }));
};
