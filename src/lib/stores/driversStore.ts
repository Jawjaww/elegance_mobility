"use client";

import { create } from "zustand";
import { supabase } from "@/lib/database/client";
import type {
  Database,
  Driver as DbDriver,
} from "@/lib/types/database.types";

// Types de base (generated schema)
type RideRow = Database["public"]["Tables"]["rides"]["Row"];
type VehicleRow = Database["public"]["Tables"]["vehicles"]["Row"];

type Driver = Pick<
  DbDriver,
  | "id"
  | "user_id"
  | "status"
  | "first_name"
  | "last_name"
  | "phone"
  | "current_vehicle_id"
  | "created_at"
  | "updated_at"
> & {
  license_number?: string;
  default_vehicle_id?: string;
};

interface DriverWithDetails extends Driver {
  vehicle?: VehicleRow;
  todayStats?: {
    completedRides: number;
    totalEarnings: number;
    totalDistance: number;
    remainingRides: number;
  };
}

interface DriversState {
  drivers: DriverWithDetails[];
  activeDriver: DriverWithDetails | null;
  loading: boolean;
  error: string | null;
  // Actions
  fetchDrivers: () => Promise<void>;
  fetchDriverDetails: (driverId: string) => Promise<void>;
  setActiveDriver: (driver: DriverWithDetails | null) => void;
  updateDriverStatus: (
    driverId: string,
    status: Driver["status"],
  ) => Promise<void>;
  assignVehicle: (driverId: string, vehicleId: string) => Promise<void>;
  fetchDriverDailyStats: (driverId: string) => Promise<void>;
}

export const useDriversStore = create<DriversState>((set, get) => ({
  drivers: [],
  activeDriver: null,
  loading: false,
  error: null,

  fetchDrivers: async () => {
    set({ loading: true, error: null });
    try {
      console.log("🔍 Tentative de récupération des chauffeurs...");

      // D'abord récupérer les chauffeurs
      const { data: drivers, error: driversError } = await supabase
        .from("drivers")
        .select("*")
        .order("created_at", { ascending: false });

      console.log("📊 Résultat requête drivers:", { drivers, driversError });

      if (driversError) {
        console.error("❌ Erreur drivers:", driversError);
        throw driversError;
      }

      if (!drivers) {
        console.log("⚠️ Aucun driver trouvé");
        set({ drivers: [], loading: false });
        return;
      }

      console.log(`✅ ${drivers.length} drivers trouvés:`, drivers);

      // Récupérer les véhicules séparément si nécessaire
      const driversWithDetails: DriverWithDetails[] = await Promise.all(
        drivers.map(async (driver) => {
          let vehicle: VehicleRow | undefined;

          // Récupérer le véhicule si un ID est spécifié
          if (driver.current_vehicle_id || driver.default_vehicle_id) {
            const vehicleId =
              driver.current_vehicle_id || driver.default_vehicle_id;
            const { data: vehicleData } = await supabase
              .from("vehicles")
              .select("*")
              .eq("id", vehicleId)
              .single();

            vehicle = vehicleData || undefined;
          }

          return {
            ...driver,
            vehicle,
          };
        }),
      );

      console.log("🚗 Drivers avec détails:", driversWithDetails);

      set({
        drivers: driversWithDetails,
        loading: false,
      });
    } catch (error: any) {
      console.error("❌ Erreur lors de la récupération des chauffeurs:", error);
      set({
        error: error.message || "Erreur lors de la récupération des chauffeurs",
        loading: false,
      });
    }
  },

  fetchDriverDetails: async (driverId: string) => {
    try {
      const { data: driver, error } = await supabase
        .from("drivers")
        .select("*")
        .eq("id", driverId)
        .single();

      if (error) throw error;

      let vehicle: VehicleRow | undefined;

      // Récupérer le véhicule si un ID est spécifié
      if (driver.current_vehicle_id || driver.default_vehicle_id) {
        const vehicleId =
          driver.current_vehicle_id || driver.default_vehicle_id;
        const { data: vehicleData } = await supabase
          .from("vehicles")
          .select("*")
          .eq("id", vehicleId)
          .single();

        vehicle = vehicleData || undefined;
      }

      // Mise à jour du driver dans le state
      set((state) => ({
        drivers: state.drivers.map((d) =>
          d.id === driverId ? { ...driver, vehicle } : d,
        ),
      }));
    } catch (error: any) {
      console.error("Erreur lors de la récupération des détails:", error);
    }
  },

  setActiveDriver: (driver) => {
    set({ activeDriver: driver });
  },

  updateDriverStatus: async (driverId: string, status: Driver["status"]) => {
    try {
      if (status !== "active" && status !== "rejected") {
        throw new Error(
          "Seules les transitions active/rejected via validate_driver_dossier sont supportées",
        );
      }

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Non authentifié");

      const { data, error } = await supabase.rpc("validate_driver_dossier", {
        p_driver_id: driverId,
        p_admin_user_id: user.id,
        p_approved: status === "active",
        p_rejection_reason: null,
      });
      if (error) throw error;

      const row = Array.isArray(data) ? data[0] : data;
      if (row?.success === false) {
        throw new Error(row.message || "Validation refusée");
      }

      const nextStatus = (row?.new_status as Driver["status"]) || status;

      // Optimistic local update
      set((state) => ({
        drivers: state.drivers.map((driver) =>
          driver.id === driverId
            ? {
                ...driver,
                status: nextStatus,
                updated_at: new Date().toISOString(),
              }
            : driver,
        ),
      }));

      const activeDriver = get().activeDriver;
      if (activeDriver?.id === driverId) {
        set({
          activeDriver: {
            ...activeDriver,
            status: nextStatus,
            updated_at: new Date().toISOString(),
          },
        });
      }
    } catch (error: any) {
      console.error("Erreur updateDriverStatus:", error);
      get().fetchDrivers();
      throw error;
    }
  },

  assignVehicle: async (driverId: string, vehicleId: string) => {
    try {
      const { error } = await supabase
        .from("drivers")
        .update({
          current_vehicle_id: vehicleId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", driverId);

      if (error) throw error;

      // Récupérer les détails du véhicule
      const { data: vehicle } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", vehicleId)
        .single();

      // Mise à jour optimiste du state
      set((state) => ({
        drivers: state.drivers.map((driver) =>
          driver.id === driverId
            ? {
                ...driver,
                current_vehicle_id: vehicleId,
                vehicle,
                updated_at: new Date().toISOString(),
              }
            : driver,
        ),
      }));

      // Mettre à jour activeDriver si nécessaire
      const activeDriver = get().activeDriver;
      if (activeDriver?.id === driverId) {
        set({
          activeDriver: {
            ...activeDriver,
            current_vehicle_id: vehicleId,
            vehicle,
            updated_at: new Date().toISOString(),
          },
        });
      }
    } catch (error: any) {
      console.error("Erreur lors de l'assignation du véhicule:", error);
      // Recharger en cas d'erreur
      get().fetchDrivers();
    }
  },

  fetchDriverDailyStats: async (driverId: string) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: rides, error } = await supabase
        .from("rides")
        .select("*")
        .eq("driver_id", driverId)
        .gte("pickup_time", today.toISOString())
        .lt(
          "pickup_time",
          new Date(today.getTime() + 24 * 60 * 60 * 1000).toISOString(),
        );

      if (error) throw error;

      const stats = rides.reduce(
        (acc, ride: RideRow) => ({
          completedRides:
            acc.completedRides + (ride.status === "completed" ? 1 : 0),
          totalEarnings:
            acc.totalEarnings +
            (ride.status === "completed" ? ride.final_price || 0 : 0),
          totalDistance: acc.totalDistance + (ride.distance || 0),
          remainingRides:
            acc.remainingRides +
            (["assigned", "accepted", "in_progress"].includes(ride.status)
              ? 1
              : 0),
        }),
        {
          completedRides: 0,
          totalEarnings: 0,
          totalDistance: 0,
          remainingRides: 0,
        },
      );

      // Mise à jour du driver avec les stats
      set((state) => ({
        drivers: state.drivers.map((driver) =>
          driver.id === driverId ? { ...driver, todayStats: stats } : driver,
        ),
        activeDriver:
          state.activeDriver?.id === driverId
            ? { ...state.activeDriver, todayStats: stats }
            : state.activeDriver,
      }));
    } catch (error: any) {
      console.error("Erreur lors de la récupération des statistiques:", error);
    }
  },
}));

// Setup des souscriptions en temps réel

// Hook client pour souscription Supabase
import { useEffect } from "react";
export function useDriversStoreSubscription() {
  useEffect(() => {
    const channel = supabase
      .channel("store-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "drivers" },
        () => useDriversStore.getState().fetchDrivers(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rides" },
        (payload: { new: { driver_id?: string } }) => {
          if (payload.new?.driver_id) {
            useDriversStore
              .getState()
              .fetchDriverDailyStats(payload.new.driver_id);
          }
        },
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, []);
}

export default useDriversStore;
