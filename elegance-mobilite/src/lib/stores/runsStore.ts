export interface DeliveryRun { 
  id: string;
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  time_window_start?: Date;
  time_window_end?: Date;
  driver_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Store minimal pour les runs
import { create } from 'zustand';

interface RunsState {
  runs: DeliveryRun[];
  loading: boolean;
  error: string | null;
  fetchRuns: () => Promise<void>;
  createRun: (run: Partial<DeliveryRun>) => Promise<void>;
  updateRun: (id: string, run: Partial<DeliveryRun>) => Promise<void>;
  deleteRun: (id: string) => Promise<void>;
}

export const useRunsStore = create<RunsState>((set) => ({
  runs: [],
  loading: false,
  error: null,
  fetchRuns: async () => {
    set({ loading: true });
    try {
      // Stub implementation
      set({ runs: [], loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch runs', loading: false });
    }
  },
  createRun: async (run) => {
    // Stub implementation
  },
  updateRun: async (id, run) => {
    // Stub implementation
  },
  deleteRun: async (id) => {
    // Stub implementation
  },
}));
