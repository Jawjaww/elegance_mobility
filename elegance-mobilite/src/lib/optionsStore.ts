import { create } from 'zustand'
import { supabase } from './supabaseClient'

interface Option {
  id: string
  name: string
  price: number
}

interface OptionsStore {
  options: Option[]
  loading: boolean
  error: string | null
  fetchOptions: () => Promise<void>
  updateOption: (id: string, newOption: Partial<Option>) => Promise<void>
}

export const useOptionsStore = create<OptionsStore>((set) => ({
  options: [],
  loading: false,
  error: null,

  fetchOptions: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('options')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error

      set({ 
        options: data,
        loading: false 
      })
    } catch (error: unknown) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false 
      })
    }
  },

  updateOption: async (id, newOption) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('options')
        .update(newOption)
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        options: state.options.map(option => 
          option.id === id ? { ...option, ...newOption } : option
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
