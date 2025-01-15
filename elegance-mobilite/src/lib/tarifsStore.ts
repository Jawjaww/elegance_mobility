import { create } from 'zustand'
import { supabase } from './supabaseClient'

interface Tarif {
  id: string
  type: string
  base_rate: number
  peak_rate: number
  night_rate: number
}

interface TarifsStore {
  tarifs: Tarif[]
  loading: boolean
  error: string | null
  fetchTarifs: () => Promise<void>
  updateTarif: (id: string, newTarif: Partial<Tarif>) => Promise<void>
}

export const useTarifsStore = create<TarifsStore>((set) => ({
  tarifs: [],
  loading: false,
  error: null,

  fetchTarifs: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('rates')
        .select('*')
        .order('type', { ascending: true })

      if (error) throw error

      set({ 
        tarifs: data.map(rate => ({
          id: rate.id,
          type: rate.type,
          base_rate: rate.off_peak_rate,
          peak_rate: rate.peak_rate,
          night_rate: rate.night_rate
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

  updateTarif: async (id, newTarif) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('rates')
        .update({
          off_peak_rate: newTarif.base_rate,
          peak_rate: newTarif.peak_rate,
          night_rate: newTarif.night_rate
        })
        .eq('id', id)

      if (error) throw new Error(error.message)

      // Refresh the list after update
      set((state) => ({
        tarifs: state.tarifs.map(tarif => 
          tarif.id === id ? { ...tarif, ...newTarif } : tarif
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
