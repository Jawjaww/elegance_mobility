import { Database } from "./types/database.types";
import { supabase } from "@/lib/database/client";

// Utiliser les types corrects selon la structure de Database
export type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];
export type NewVehicle = Database["public"]["Tables"]["vehicles"]["Insert"];
export type UpdateVehicle = Database["public"]["Tables"]["vehicles"]["Update"];
export type VehicleType = Database["public"]["Enums"]["vehicle_type_enum"];

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

// Options de réservation
export interface VehicleOptions {
  childSeat: boolean;
  petFriendly: boolean;
  [key: string]: boolean | undefined;
}

// Utilise le singleton `supabase` configuré dans `src/lib/database/client.ts`

/**
 * Fetches all vehicles from the database
 */
export async function getAllVehicles() {
  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Error fetching vehicles: ${error.message}`);
  }

  return data;
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
