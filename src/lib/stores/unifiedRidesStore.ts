import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Database } from "@/lib/types/database.types";

type DatabaseRide = Database["public"]["Tables"]["rides"]["Row"];
type DatabaseDriver = Database["public"]["Tables"]["drivers"]["Row"];
type DatabaseUser = Database["public"]["Tables"]["users"]["Row"];
export type RideStatus = Database["public"]["Enums"]["ride_status"];

export type RideWithRelations = DatabaseRide & {
  driver: Pick<
    DatabaseDriver,
    "id" | "first_name" | "last_name" | "phone"
  > | null;
  customer: Pick<
    DatabaseUser,
    "id" | "first_name" | "last_name" | "phone"
  > | null;
};

export type FilterStatus = RideStatus | "all" | "canceled";

interface RidesFilterState {
  selectedDate: Date;
  selectedStatus: FilterStatus;
  driverFilter: string | null;
  clientFilter: string | null;
  searchQuery: string;
  viewMode: "day" | "month";
  /** False until the Courses page has applied URL params (avoids a wrong first fetch). */
  filtersReady: boolean;
  setSelectedDate: (date: Date) => void;
  setSelectedStatus: (status: FilterStatus) => void;
  setDriverFilter: (driverId: string | null) => void;
  setClientFilter: (clientId: string | null) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: "day" | "month") => void;
  setFiltersReady: (ready: boolean) => void;
}

export const useUnifiedRidesStore = create<RidesFilterState>()(
  devtools(
    (set) => ({
      selectedDate: new Date(),
      selectedStatus: "all",
      driverFilter: null,
      clientFilter: null,
      searchQuery: "",
      viewMode: "month",
      filtersReady: false,
      setSelectedDate: (date) => set({ selectedDate: date }),
      setSelectedStatus: (status) => set({ selectedStatus: status }),
      setDriverFilter: (driverId) => set({ driverFilter: driverId }),
      setClientFilter: (clientId) => set({ clientFilter: clientId }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setViewMode: (mode) => set({ viewMode: mode }),
      setFiltersReady: (ready) => set({ filtersReady: ready }),
    }),
    { name: "unified-rides-store" },
  ),
);

export default useUnifiedRidesStore;
