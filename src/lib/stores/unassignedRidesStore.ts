import { create } from 'zustand';
import { supabase } from '@/lib/database/client';

interface UnassignedRide {
  id: string;
  pickup_lat: number;
  pickup_lon: number; // Standardisé sur lon uniquement
  dropoff_lat: number;
  dropoff_lon: number; // Standardisé sur lon uniquement
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

  assignRide: async (rideId: string, driverId: string, _vehicleId: string) => {
    try {
      set({ loading: true, error: null });
      const { data, error } = await supabase.rpc('admin_reassign_ride', {
        p_ride_id: rideId,
        p_driver_id: driverId,
      });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (row && (row as { success?: boolean }).success === false) {
        throw new Error(
          (row as { error?: string }).error || 'Réaffectation refusée',
        );
      }

      const rides = get().rides.filter(ride => ride.id !== rideId);
      set({ rides });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Une erreur est survenue' });
    } finally {
      set({ loading: false });
    }
  }
}));

// Écouter les changements en temps réel - CORRIGÉ
const unassignedChannel = supabase
  .channel('unassigned-rides')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'rides',
      filter: 'status=eq.pending'
    },
    (payload) => {
      // Vérifier que driver_id est null
      if (!payload.new.driver_id) {
        useUnassignedRidesStore.getState().fetchRides();
      }
    }
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'rides'
    },
    () => {
      useUnassignedRidesStore.getState().fetchRides();
    }
  )
  .subscribe();
