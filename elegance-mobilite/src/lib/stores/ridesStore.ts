import { create } from 'zustand';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database.types';

export interface Ride {
  id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string;
  user_id: string;
  driver_id?: string;
  vehicle_id?: string;
  created_at: string;
  updated_at: string;
  price?: number;
}

interface RidesState {
  rides: Ride[];
  loading: boolean;
  error: string | null;
  // Actions
  fetchRides: () => Promise<void>;
  updateRideStatus: (rideId: string, status: Ride['status']) => Promise<void>;
  deleteRide: (rideId: string) => Promise<void>;
}

const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const useRidesStore = create<RidesState>((set, get) => ({
  rides: [],
  loading: false,
  error: null,

  fetchRides: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({
        rides: data as Ride[],
        loading: false
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des courses:', error);
      set({
        error: error.message || 'Erreur lors de la récupération des courses',
        loading: false
      });
    }
  },

  updateRideStatus: async (rideId: string, status: Ride['status']) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('rides')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', rideId);

      if (error) throw error;

      // Mise à jour optimiste du state
      set((state) => ({
        rides: state.rides.map((ride) =>
          ride.id === rideId
            ? { ...ride, status, updated_at: new Date().toISOString() }
            : ride
        ),
      }));
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      set({ error: error.message || 'Erreur lors de la mise à jour du statut' });
      // Recharger les données en cas d'erreur
      get().fetchRides();
    }
  },

  deleteRide: async (rideId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('rides')
        .delete()
        .eq('id', rideId);

      if (error) throw error;

      // Mise à jour optimiste du state
      set((state) => ({
        rides: state.rides.filter((ride) => ride.id !== rideId),
      }));
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      set({ error: error.message || 'Erreur lors de la suppression' });
      // Recharger les données en cas d'erreur
      get().fetchRides();
    }
  },
}));

// Setup des souscriptions en temps réel
if (typeof window !== 'undefined') {
  const supabase = createClient();
  
  supabase
    .channel('rides-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'rides'
      },
      () => {
        // Recharger les courses quand il y a des changements
        useRidesStore.getState().fetchRides();
      }
    )
    .subscribe();
}

export default useRidesStore;
