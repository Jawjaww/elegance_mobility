import { create } from 'zustand';
import type { Database } from './types/database.types';

type Ride = Database['public']['Tables']['rides']['Row'];

interface UnassignedRidesStore {
  rides: Ride[];
  selectedRide: Ride | null;
  loading: boolean;
  error: string | null;
  setRides: (rides: Ride[]) => void;
  selectRide: (ride: Ride | null) => void;
  fetchRides: () => Promise<void>;
}

export const useUnassignedRidesStore = create<UnassignedRidesStore>((set) => ({
  rides: [],
  selectedRide: null,
  loading: false,
  error: null,
  setRides: (rides) => set({ rides }),
  selectRide: (ride) => set({ selectedRide: ride }),
  fetchRides: async () => {
    set({ loading: true, error: null });
    try {
      // Stub implementation
      set({ rides: [], loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch rides', loading: false });
    }
  },
}));
