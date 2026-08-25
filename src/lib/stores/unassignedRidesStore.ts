import { create } from 'zustand';
import { supabase } from '@/lib/database/client';
import { isRideStillOfferable } from '@/lib/utils/ridePickup';

interface UnassignedRide {
  id: string;
  pickup_lat: number;
  pickup_lon: number;
  dropoff_lat: number;
  dropoff_lon: number;
  pickup_address: string;
  dropoff_address: string;
  pickup_time: string;
  vehicle_type: string;
  distance_km: number;
  price: number;
  status: string;
  matching_deadline_at?: string | null;
  matching_paused_at?: string | null;
  client_incentive?: number | null;
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
        .in('status', ['pending', 'delayed'])
        .is('driver_id', null)
        .is('matching_paused_at', null)
        .gt('matching_deadline_at', new Date().toISOString());

      if (error) throw error;

      set({
        rides: (data as UnassignedRide[]).filter((r) => isRideStillOfferable(r)),
      });
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

      const rides = get().rides.filter((ride) => ride.id !== rideId);
      set({ rides });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Une erreur est survenue' });
    } finally {
      set({ loading: false });
    }
  },
}));

const unassignedChannel = supabase
  .channel('unassigned-rides')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'rides',
    },
    (payload) => {
      if (!payload.new.driver_id && isRideStillOfferable(payload.new as UnassignedRide)) {
        useUnassignedRidesStore.getState().fetchRides();
      }
    },
  )
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'rides',
    },
    () => {
      useUnassignedRidesStore.getState().fetchRides();
    },
  )
  .subscribe();
