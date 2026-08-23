import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types/database.types";
import {
  adminCancelRide,
  adminReassignRide,
  isAdminRpcFailure,
} from "@/services/adminRideService";

type DatabaseRide = Database["public"]["Tables"]["rides"]["Row"];
type DatabaseDriver = Database["public"]["Tables"]["drivers"]["Row"];
type DatabaseUser = Database["public"]["Tables"]["users"]["Row"];
type RideStatus = Database["public"]["Enums"]["ride_status"];

export type RideWithRelations = DatabaseRide & {
  driver: DatabaseDriver | null;
  customer: Pick<
    DatabaseUser,
    "id" | "first_name" | "last_name" | "phone"
  > | null;
};

type FilterStatus = RideStatus | "all";

interface RidesState {
  // État
  rides: RideWithRelations[];
  filteredRides: RideWithRelations[];
  selectedDate: Date;
  selectedStatus: FilterStatus;
  driverFilter: string | null;
  clientFilter: string | null;
  searchQuery: string;
  viewMode: "day" | "month";
  loading: boolean;
  error: string | null;

  // Actions
  fetchRides: () => Promise<void>;
  setSelectedDate: (date: Date) => void;
  setSelectedStatus: (status: FilterStatus) => void;
  setDriverFilter: (driverId: string | null) => void;
  setClientFilter: (clientId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: "day" | "month") => void;
  updateRideStatus: (rideId: string, status: RideStatus) => Promise<void>;
  assignDriver: (rideId: string, driverId: string) => Promise<void>;
  deleteRide: (rideId: string) => Promise<void>;
}

const createClient = () => {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
};

type RideFilterParams = {
  selectedDate: Date;
  selectedStatus: FilterStatus;
  driverFilter: string | null;
  viewMode: "day" | "month";
  clientFilter: string | null;
  searchQuery: string;
};

function rideSearchHaystack(ride: RideWithRelations): string {
  const parts = [
    ride.id,
    ride.pickup_address,
    ride.dropoff_address,
    ride.pickup_notes,
    ride.cancellation_reason,
    ride.customer?.first_name,
    ride.customer?.last_name,
    ride.customer?.phone,
    ride.driver?.first_name,
    ride.driver?.last_name,
    ride.driver?.phone,
    ride.user_id,
    ride.driver_id,
    ride.status,
    ride.vehicle_type,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}

const applyFilters = (
  rides: RideWithRelations[],
  f: RideFilterParams,
): RideWithRelations[] => {
  let start: Date;
  let end: Date;
  if (f.viewMode === "month") {
    start = new Date(
      f.selectedDate.getFullYear(),
      f.selectedDate.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );
    end = new Date(
      f.selectedDate.getFullYear(),
      f.selectedDate.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    );
  } else {
    start = new Date(f.selectedDate);
    start.setHours(0, 0, 0, 0);
    end = new Date(f.selectedDate);
    end.setHours(23, 59, 59, 999);
  }

  const q = f.searchQuery.trim().toLowerCase();

  return rides.filter((ride) => {
    const rideDate = new Date(ride.pickup_time);
    const matchesDate = rideDate >= start && rideDate <= end;

    let matchesStatus = true;
    if (f.selectedStatus !== "all") {
      matchesStatus = ride.status === f.selectedStatus;
    }

    const matchesDriver = !f.driverFilter || ride.driver_id === f.driverFilter;
    const matchesClient = !f.clientFilter || ride.user_id === f.clientFilter;
    const matchesSearch = !q || rideSearchHaystack(ride).includes(q);

    return (
      matchesDate &&
      matchesStatus &&
      matchesDriver &&
      matchesClient &&
      matchesSearch
    );
  });
};

function filterParamsFromState(state: {
  selectedDate: Date;
  selectedStatus: FilterStatus;
  driverFilter: string | null;
  viewMode: "day" | "month";
  clientFilter: string | null;
  searchQuery: string;
}): RideFilterParams {
  return {
    selectedDate: state.selectedDate,
    selectedStatus: state.selectedStatus,
    driverFilter: state.driverFilter,
    viewMode: state.viewMode,
    clientFilter: state.clientFilter,
    searchQuery: state.searchQuery,
  };
}

export const useUnifiedRidesStore = create<RidesState>()(
  devtools(
    (set, get) => ({
      rides: [],
      filteredRides: [],
      selectedDate: new Date(),
      selectedStatus: "all",
      driverFilter: null,
      clientFilter: null,
      searchQuery: "",
      viewMode: "month",
      loading: false,
      error: null,

      fetchRides: async () => {
        set({ loading: true, error: null });
        try {
          const supabase = createClient();
          const { data, error } = await supabase
            .from("rides")
            .select(
              `
              *,
              driver:drivers(*),
              customer:users!rides_user_id_fkey(id, first_name, last_name, phone)
            `,
            )
            .order("pickup_time", { ascending: true });

          if (error) throw error;

          const rides: RideWithRelations[] = (data ?? []).map((ride) => {
            const row = ride as DatabaseRide & {
              driver?: DatabaseDriver | DatabaseDriver[] | null;
              customer?:
                | Pick<DatabaseUser, "id" | "first_name" | "last_name" | "phone">
                | Pick<
                    DatabaseUser,
                    "id" | "first_name" | "last_name" | "phone"
                  >[]
                | null;
            };
            const driver = Array.isArray(row.driver)
              ? (row.driver[0] ?? null)
              : (row.driver ?? null);
            const customer = Array.isArray(row.customer)
              ? (row.customer[0] ?? null)
              : (row.customer ?? null);
            const { driver: _d, customer: _c, ...rest } = row;
            return {
              ...(rest as DatabaseRide),
              driver,
              customer,
            };
          });

          const filteredRides = applyFilters(
            rides,
            filterParamsFromState(get()),
          );

          set({
            rides,
            filteredRides,
            loading: false,
          });
        } catch (error: any) {
          console.error("Erreur lors de la récupération des courses:", error);
          set({
            error:
              error.message || "Erreur lors de la récupération des courses",
            loading: false,
          });
        }
      },

      setSelectedDate: (date) => {
        const state = get();
        const filteredRides = applyFilters(state.rides, {
          ...filterParamsFromState(state),
          selectedDate: date,
        });
        set({ selectedDate: date, filteredRides });
      },

      setSelectedStatus: (status) => {
        const state = get();
        const filteredRides = applyFilters(state.rides, {
          ...filterParamsFromState(state),
          selectedStatus: status,
        });
        set({ selectedStatus: status, filteredRides });
      },

      setDriverFilter: (driverId) => {
        const state = get();
        const filteredRides = applyFilters(state.rides, {
          ...filterParamsFromState(state),
          driverFilter: driverId,
        });
        set({ driverFilter: driverId, filteredRides });
      },

      setClientFilter: (clientId) => {
        const state = get();
        const filteredRides = applyFilters(state.rides, {
          ...filterParamsFromState(state),
          clientFilter: clientId,
        });
        set({ clientFilter: clientId, filteredRides });
      },

      setSearchQuery: (query) => {
        const state = get();
        const filteredRides = applyFilters(state.rides, {
          ...filterParamsFromState(state),
          searchQuery: query,
        });
        set({ searchQuery: query, filteredRides });
      },

      setViewMode: (mode) => {
        const state = get();
        const filteredRides = applyFilters(state.rides, {
          ...filterParamsFromState(state),
          viewMode: mode,
        });
        set({ viewMode: mode, filteredRides });
      },

      updateRideStatus: async (rideId, status) => {
        try {
          if (status === "admin-canceled") {
            const row = await adminCancelRide(rideId);
            if (isAdminRpcFailure(row)) {
              throw new Error(row.error || "Annulation refusée");
            }
          } else {
            throw new Error(
              "Mise à jour de statut admin via RPC uniquement (admin_cancel_ride / admin_reassign_ride)",
            );
          }

          const updateRide = (rides: RideWithRelations[]): RideWithRelations[] =>
            rides.map((ride) =>
              ride.id === rideId
                ? { ...ride, status, updated_at: new Date().toISOString() }
                : ride,
            );

          const updatedRides = updateRide(get().rides);
          const filteredRides = applyFilters(
            updatedRides,
            filterParamsFromState(get()),
          );

          set({
            rides: updatedRides,
            filteredRides,
          });
        } catch (error: any) {
          console.error("Erreur lors de la mise à jour du statut:", error);
          set({
            error: error.message || "Erreur lors de la mise à jour du statut",
          });
        }
      },

      assignDriver: async (rideId, driverId) => {
        try {
          const supabase = createClient();
          const newStatus: RideStatus = "scheduled";

          const row = await adminReassignRide(rideId, driverId);
          if (isAdminRpcFailure(row)) {
            throw new Error(row.error || "Réaffectation refusée");
          }

          const { data: driver, error: driverError } = await supabase
            .from("drivers")
            .select("*")
            .eq("id", driverId)
            .single();

          if (driverError) throw driverError;

          const updateRide = (rides: RideWithRelations[]): RideWithRelations[] =>
            rides.map((ride) =>
              ride.id === rideId
                ? {
                    ...ride,
                    driver_id: driverId,
                    driver: driver as DatabaseDriver,
                    status: newStatus,
                    updated_at: new Date().toISOString(),
                  }
                : ride,
            );

          const updatedRides = updateRide(get().rides);
          const filteredRides = applyFilters(
            updatedRides,
            filterParamsFromState(get()),
          );

          set({
            rides: updatedRides,
            filteredRides,
          });
        } catch (error: any) {
          console.error("Erreur lors de l'assignation du chauffeur:", error);
          set({
            error: error.message || "Erreur lors de l'assignation du chauffeur",
          });
        }
      },

      deleteRide: async (rideId) => {
        try {
          const supabase = createClient();
          const { error } = await supabase
            .from("rides")
            .delete()
            .eq("id", rideId);

          if (error) throw error;

          const updatedRides = get().rides.filter((ride) => ride.id !== rideId);
          const filteredRides = applyFilters(
            updatedRides,
            filterParamsFromState(get()),
          );

          set({
            rides: updatedRides,
            filteredRides,
          });
        } catch (error: any) {
          console.error("Erreur lors de la suppression:", error);
          set({ error: error.message || "Erreur lors de la suppression" });
          get().fetchRides();
        }
      },
    }),
    { name: "unified-rides-store" },
  ),
);

// Setup des souscriptions en temps réel

// Hook client pour souscription Supabase
import { useEffect } from "react";
export function useUnifiedRidesStoreSubscription() {
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("rides-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "rides",
        },
        () => {
          useUnifiedRidesStore.getState().fetchRides();
        },
      )
      .subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, []);
}

export default useUnifiedRidesStore;
