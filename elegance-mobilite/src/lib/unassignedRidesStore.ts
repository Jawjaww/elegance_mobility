import { create } from 'zustand';
import { supabase } from './supabaseClient';

interface UnassignedRide {
  id: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string;
  vehicle_type: string;
  distance_km: number;
  price: number;
  status: 'pending';
}

interface UnassignedRidesState {
  rides: UnassignedRide[];
  loading: boolean;
  error: string | null;
  fetchRides: () => Promise<void>;
  assignRide: (rideId: string, driverId: string, vehicleId: string) => Promise<void>;
}

export const useUnassignedRidesStore = create<UnassignedRidesState>((set, get) => ({
  rides: [],
  loading: false,
  error: null,

  fetchRides: async () => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase
        .from('rides')
        .select('*')
        .eq('status', 'pending')
        .is('driver_id', null);

      if (error) throw error;

      set({ rides: data as UnassignedRide[] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Une erreur est survenue' });
    } finally {
      set({ loading: false });
    }
  },

  assignRide: async (rideId: string, driverId: string, vehicleId: string) => {
    try {
      set({ loading: true, error: null });
      const { error } = await supabase
        .from('rides')
        .update({
          driver_id: driverId,
          vehicle_id: vehicleId,
          status: 'assigned'
        })
        .eq('id', rideId);

      if (error) throw error;

      // Mettre à jour la liste des courses non attribuées
      const rides = get().rides.filter(ride => ride.id !== rideId);
      set({ rides });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Une erreur est survenue' });
    } finally {
      set({ loading: false });
    }
  }
}));

// Écouter les changements en temps réel
supabase
  .channel('unassigned-rides')
  .on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'rides',
      filter: "status=eq.'pending' AND driver_id=is.null"
    },
    () => {
      useUnassignedRidesStore.getState().fetchRides();
    }
  )
  .subscribe();