"use client";

import { create } from "zustand";
import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";

type DriverStatus = Database["public"]["Enums"]["driver_status"];

/**
 * The only driver fields any backoffice screen reads.
 *
 * This list used to be `select("*")` — 42 columns, including the full dossier, fetched to
 * render a name in a `<SelectItem>` and a status in a filter. Narrowing it keeps the payload
 * proportional to what is displayed, and the type below now states what a caller may rely on
 * rather than exposing a whole row nobody had checked.
 */
const DRIVER_LIST_COLUMNS = "id, first_name, last_name, phone, status";

export type DriverListEntry = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  status: DriverStatus;
};

interface DriversState {
  drivers: DriverListEntry[];
  loading: boolean;
  /**
   * Kept as the store's failure surface. No screen reads it today, but a failed list must not
   * vanish silently: an empty driver selector is indistinguishable from a fleet with no
   * drivers, and that is the state this store used to produce.
   */
  error: string | null;
  fetchDrivers: () => Promise<void>;
}

export const useDriversStore = create<DriversState>((set) => ({
  drivers: [],
  loading: false,
  error: null,

  /**
   * One request, not two.
   *
   * Two shapes were removed here. The first awaited a `.single()` vehicle query per driver
   * inside a `map`, so a page paid 1 + N round-trips for a list it renders at once. The second
   * resolved those vehicles in a single batched query — better, but still pointless: no
   * consumer reads `driver.vehicle`, so the request was buying a field nothing looked at.
   */
  fetchDrivers: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from("drivers")
        .select(DRIVER_LIST_COLUMNS)
        .order("created_at", { ascending: false });

      if (error) throw error;

      set({ drivers: data ?? [], loading: false });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Erreur lors du chargement";
      console.error("[driversStore] driver list fetch failed:", message);
      set({ error: message, loading: false });
    }
  },
}));

export default useDriversStore;
