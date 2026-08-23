import { Database } from "./types/database.types";
import { supabase } from "@/lib/database/client";

// Utiliser les types corrects selon la structure de Database
export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type NewVehicle = Database["public"]["Tables"]["vehicles"]["Insert"];
export type UpdateVehicle = Database["public"]["Tables"]["vehicles"]["Update"];
export type VehicleType = Database["public"]["Enums"]["vehicle_type_enum"];

type VehicleDriver = Pick<
  Database["public"]["Tables"]["drivers"]["Row"],
  "id" | "first_name" | "last_name" | "phone" | "current_vehicle_id"
>;

export type VehicleWithDriver = Vehicle & {
  driver: VehicleDriver | null;
};

// Constantes runtime pour les types de véhicules (alignées sur database.types)
export const VEHICLE_TYPE_STANDARD: VehicleType = "STANDARD";
export const VEHICLE_TYPE_PREMIUM: VehicleType = "PREMIUM";
export const VEHICLE_TYPE_VAN: VehicleType = "VAN";
export const VEHICLE_TYPE_ELECTRIC: VehicleType = "ELECTRIC";

// Object pour faciliter l'accès aux constantes (équivalent runtime de l'ancien enum)
export const VEHICLE_TYPES = {
  STANDARD: VEHICLE_TYPE_STANDARD,
  PREMIUM: VEHICLE_TYPE_PREMIUM,
  VAN: VEHICLE_TYPE_VAN,
  ELECTRIC: VEHICLE_TYPE_ELECTRIC,
} as const;

// Options de réservation (keys = option names from DB, plus legacy aliases)
export interface VehicleOptions {
  [key: string]: boolean | undefined;
}

export const DEFAULT_VEHICLE_OPTIONS: VehicleOptions = {};

export function vehicleOptionsFromSelected(
  selected: string[] | undefined | null,
): VehicleOptions {
  const result: VehicleOptions = { ...DEFAULT_VEHICLE_OPTIONS };
  for (const raw of selected ?? []) {
    if (!raw) continue;
    result[raw] = true;
  }
  return result;
}

export function selectedFromVehicleOptions(options: VehicleOptions): string[] {
  return Object.entries(options)
    .filter(([, value]) => Boolean(value))
    .map(([key]) => key);
}

// Utilise le singleton `supabase` configuré dans `src/lib/database/client.ts`

/**
 * Fetches all vehicles from the database
 */
export async function getAllVehicles(): Promise<VehicleWithDriver[]> {
  const { data, error } = await supabase
    .from("vehicles")
    .select(
      `
      *,
      driver:drivers!driver_id(
        id,
        first_name,
        last_name,
        phone,
        current_vehicle_id
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error fetching vehicles: ${error.message}`);
  }

  return (data ?? []) as VehicleWithDriver[];
}

/**
 * Fetches a vehicle by its ID
 */
export async function getVehicleById(id: string) {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    throw new Error(`Error fetching vehicle: ${error.message}`);
  }

  return data;
}

/**
 * Creates a new vehicle
 */
export async function createVehicle(vehicle: NewVehicle) {
  const { data, error } = await supabase
    .from("vehicles")
    .insert(vehicle)
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating vehicle: ${error.message}`);
  }

  return data;
}

/**
 * Updates an existing vehicle
 */
export async function updateVehicle(id: string, updates: UpdateVehicle) {
  const { data, error } = await supabase
    .from("vehicles")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    throw new Error(`Error updating vehicle: ${error.message}`);
  }

  return data;
}

/**
 * Syncs primary vehicle flags and the driver's current_vehicle_id after admin edit.
 */
export async function syncVehicleDriverAssignment(
  vehicleId: string,
  driverId: string | null,
  isPrimary: boolean,
) {
  if (!driverId) return;

  if (isPrimary) {
    const { error: clearError } = await supabase
      .from("vehicles")
      .update({ is_primary: false, updated_at: new Date().toISOString() })
      .eq("driver_id", driverId)
      .neq("id", vehicleId);

    if (clearError) {
      throw new Error(
        `Error clearing primary vehicles: ${clearError.message}`,
      );
    }

    const { error: driverError } = await supabase
      .from("drivers")
      .update({
        current_vehicle_id: vehicleId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", driverId);

    if (driverError) {
      throw new Error(
        `Error updating driver current vehicle: ${driverError.message}`,
      );
    }
  }
}

/**
 * Deletes a vehicle
 */
export async function deleteVehicle(id: string) {
  const { error } = await supabase.from("vehicles").delete().eq("id", id);

  if (error) {
    throw new Error(`Error deleting vehicle: ${error.message}`);
  }
}

/**
 * Gets all available vehicle types
 */
import { VEHICLE_TYPES as RUNTIME_VEHICLE_TYPES } from "@/lib/utils/vehicle";

export function getVehicleTypes(): VehicleType[] {
  return RUNTIME_VEHICLE_TYPES as unknown as VehicleType[];
}
