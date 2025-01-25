import { create } from 'zustand'
import { supabase } from './supabaseClient'

interface Driver {
  id: string
  firstName: string
  lastName: string
  licenseNumber: string
  status: 'available' | 'on-duty' | 'off-duty'
}

interface DriversStore {
  drivers: Driver[]
  loading: boolean
  error: string | null
  fetchDrivers: () => Promise<void>
  updateDriver: (id: string, newDriver: Partial<Driver>) => Promise<void>
}

export const useDriversStore = create<DriversStore>((set) => ({
  drivers: [],
  loading: false,
  error: null,

  fetchDrivers: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('lastName', { ascending: true })

      if (error) throw error

      set({ 
        drivers: data,
        loading: false 
      })
    } catch (error: unknown) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false 
      })
    }
  },

  updateDriver: async (id, newDriver) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('drivers')
        .update(newDriver)
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        drivers: state.drivers.map(driver => 
          driver.id === id ? { ...driver, ...newDriver } : driver
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
