import { create } from 'zustand'
import { supabase } from './supabaseClient'

interface Driver {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  license_number: string
  status: 'active' | 'inactive'
  current_vehicle?: string
  created_at: string
  updated_at: string
}

interface DriversStore {
  drivers: Driver[]
  loading: boolean
  error: string | null
  selectedDriver: Driver | null
  fetchDrivers: () => Promise<void>
  addDriver: (driver: Omit<Driver, 'id' | 'created_at' | 'updated_at'>) => Promise<void>
  updateDriver: (id: string, updates: Partial<Driver>) => Promise<void>
  deleteDriver: (id: string) => Promise<void>
  setSelectedDriver: (driver: Driver | null) => void
}

export const useDriversStore = create<DriversStore>((set, get) => ({
  drivers: [],
  loading: false,
  error: null,
  selectedDriver: null,

  fetchDrivers: async () => {
    try {
      set({ loading: true, error: null })
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      set({ drivers: data as Driver[] })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors du chargement des chauffeurs' })
    } finally {
      set({ loading: false })
    }
  },

  addDriver: async (driverData) => {
    try {
      set({ loading: true, error: null })
      const { error } = await supabase
        .from('drivers')
        .insert([driverData])

      if (error) throw error

      // Recharger la liste après l'ajout
      await get().fetchDrivers()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de l\'ajout du chauffeur' })
    } finally {
      set({ loading: false })
    }
  },

  updateDriver: async (id, updates) => {
    try {
      set({ loading: true, error: null })
      const { error } = await supabase
        .from('drivers')
        .update(updates)
        .eq('id', id)

      if (error) throw error

      // Recharger la liste après la mise à jour
      await get().fetchDrivers()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de la mise à jour du chauffeur' })
    } finally {
      set({ loading: false })
    }
  },

  deleteDriver: async (id) => {
    try {
      set({ loading: true, error: null })
      const { error } = await supabase
        .from('drivers')
        .delete()
        .eq('id', id)

      if (error) throw error

      // Recharger la liste après la suppression
      await get().fetchDrivers()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erreur lors de la suppression du chauffeur' })
    } finally {
      set({ loading: false })
    }
  },

  setSelectedDriver: (driver) => {
    set({ selectedDriver: driver })
  }
}))