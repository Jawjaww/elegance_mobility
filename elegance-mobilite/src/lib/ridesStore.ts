import { create } from 'zustand'
import { supabase } from '@/utils/supabase/client'

interface Ride {
  id: string
  clientName: string
  pickupAddress: string
  dropoffAddress: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  driverId: string | null
  createdAt: string
}

interface RidesStore {
  rides: Ride[]
  loading: boolean
  error: string | null
  fetchRides: () => Promise<void>
  updateRide: (id: string, newRide: Partial<Ride>) => Promise<void>
}

export const useRidesStore = create<RidesStore>((set) => ({
  rides: [],
  loading: false,
  error: null,

  fetchRides: async () => {
    set({ loading: true, error: null })
    try {
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('createdAt', { ascending: false })

      if (error) throw error

      set({ 
        rides: data,
        loading: false 
      })
    } catch (error: unknown) {
      set({ 
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        loading: false 
      })
    }
  },

  updateRide: async (id, newRide) => {
    set({ loading: true, error: null })
    try {
      const { error } = await supabase
        .from('rides')
        .update(newRide)
        .eq('id', id)

      if (error) throw error

      set((state) => ({
        rides: state.rides.map(ride => 
          ride.id === id ? { ...ride, ...newRide } : ride
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
