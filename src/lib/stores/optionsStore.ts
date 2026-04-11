import { create } from 'zustand'

export interface Option {
  id: string
  name: string
  description: string
  price: number
  available: boolean
  created_at: string
  updated_at: string
}

interface OptionsState {
  options: Option[]
  isLoading: boolean
  setOptions: (options: Option[]) => void
  addOption: (option: Option) => void
  updateOption: (id: string, updates: Partial<Option>) => void
  deleteOption: (id: string) => void
  setLoading: (isLoading: boolean) => void
}

export const useStore = create<OptionsState>((set) => ({
  options: [],
  isLoading: false,
  setOptions: (options) => set({ options }),
  addOption: (option) =>
    set((state) => ({ options: [...state.options, option] })),
  updateOption: (id, updates) =>
    set((state) => ({
      options: state.options.map((option) =>
        option.id === id ? { ...option, ...updates } : option
      ),
    })),
  deleteOption: (id) =>
    set((state) => ({
      options: state.options.filter((option) => option.id !== id),
    })),
  setLoading: (isLoading) => set({ isLoading }),
}))