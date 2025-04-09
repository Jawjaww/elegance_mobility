import { create } from 'zustand';
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/lib/types/database.types';

export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended';
  license_number?: string;
  current_vehicle_id?: string;
  default_vehicle_id?: string;
  created_at: string;
  updated_at: string;
}

interface DriversState {
  drivers: Driver[];
  activeDriver: Driver | null;
  loading: boolean;
  error: string | null;
  // Actions
  fetchDrivers: () => Promise<void>;
  setActiveDriver: (driver: Driver | null) => void;
  updateDriverStatus: (driverId: string, status: Driver['status']) => Promise<void>;
  assignVehicle: (driverId: string, vehicleId: string) => Promise<void>;
}

const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
};

export const useDriversStore = create<DriversState>((set, get) => ({
  drivers: [],
  activeDriver: null,
  loading: false,
  error: null,

  fetchDrivers: async () => {
    set({ loading: true, error: null });
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('drivers')
        .select(`
          *,
          vehicles (
            id,
            brand,
            model,
            plate_number
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({
        drivers: data as Driver[],
        loading: false
      });
    } catch (error: any) {
      console.error('Erreur lors de la récupération des chauffeurs:', error);
      set({
        error: error.message || 'Erreur lors de la récupération des chauffeurs',
        loading: false
      });
    }
  },

  setActiveDriver: (driver) => {
    set({ activeDriver: driver });
  },

  updateDriverStatus: async (driverId: string, status: Driver['status']) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('drivers')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) throw error;

      // Mise à jour optimiste du state
      set((state) => ({
        drivers: state.drivers.map((driver) =>
          driver.id === driverId
            ? { ...driver, status, updated_at: new Date().toISOString() }
            : driver
        ),
      }));

      // Si le chauffeur actif est mis à jour, mettre à jour activeDriver aussi
      const activeDriver = get().activeDriver;
      if (activeDriver && activeDriver.id === driverId) {
        set({
          activeDriver: {
            ...activeDriver,
            status,
            updated_at: new Date().toISOString()
          }
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      set({ error: error.message || 'Erreur lors de la mise à jour du statut' });
      // Recharger les données en cas d'erreur
      get().fetchDrivers();
    }
  },

  assignVehicle: async (driverId: string, vehicleId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('drivers')
        .update({ 
          current_vehicle_id: vehicleId,
          updated_at: new Date().toISOString()
        })
        .eq('id', driverId);

      if (error) throw error;

      // Mise à jour optimiste du state
      set((state) => ({
        drivers: state.drivers.map((driver) =>
          driver.id === driverId
            ? { 
                ...driver, 
                current_vehicle_id: vehicleId,
                updated_at: new Date().toISOString()
              }
            : driver
        ),
      }));

      // Si le chauffeur actif est mis à jour, mettre à jour activeDriver aussi
      const activeDriver = get().activeDriver;
      if (activeDriver && activeDriver.id === driverId) {
        set({
          activeDriver: {
            ...activeDriver,
            current_vehicle_id: vehicleId,
            updated_at: new Date().toISOString()
          }
        });
      }
    } catch (error: any) {
      console.error('Erreur lors de l\'assignation du véhicule:', error);
      set({ error: error.message || 'Erreur lors de l\'assignation du véhicule' });
      // Recharger les données en cas d'erreur
      get().fetchDrivers();
    }
  },
}));

// Setup des souscriptions en temps réel
if (typeof window !== 'undefined') {
  const supabase = createClient();
  
  supabase
    .channel('drivers-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'drivers'
      },
      () => {
        // Recharger les chauffeurs quand il y a des changements
        useDriversStore.getState().fetchDrivers();
      }
    )
    .subscribe();
}

export default useDriversStore;
