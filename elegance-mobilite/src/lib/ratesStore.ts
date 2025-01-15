import { create } from 'zustand'
import { supabase } from './supabaseClient'

interface Rate {
  id: string
  type: string
  baseRate: number
  peakRate: number
  nightRate: number
}

interface RatesStore {
  rates: Rate[]
  loading: boolean
  error: string | null
  fetchRates: () => Promise<void>
  updateRate: (id: string, newRate: Partial<Rate>) => Promise<void>
}

export const useRatesStore = create<RatesStore>((set) => ({
  rates: [],
  loading: false,
  error: null,

  fetchRates: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('rates')
        .select('*')
        .order('type', { ascending: true })

      if (error) throw error

      set({ 
        rates: data.map(rate => ({
          id: rate.id,
          type: rate.type,
          baseRate: rate.off_peak_rate,
          peakRate: rate.peak_rate,
          nightRate: rate.night_rate
        })),
        loading: false 
      })
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
          off_peak_rate: newRate.baseRate,
          peak_rate: newRate.peakRate, 
          night_rate: newRate.nightRate
        })
        .eq('id', id)

      if (error) throw new Error(error.message)

      // Refresh the list after update
      set((state) => ({
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
  }
}))
