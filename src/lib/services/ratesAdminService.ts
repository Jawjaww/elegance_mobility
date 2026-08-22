import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";
import type { Rate } from "@/lib/services/pricingService";

type RateRow = Database["public"]["Tables"]["rates"]["Row"];
type RateInsert = Database["public"]["Tables"]["rates"]["Insert"];
type VehicleType = Database["public"]["Enums"]["vehicle_type_enum"];

export function rateRowToUi(row: RateRow): Rate & { id: number } {
  return {
    id: row.id,
    vehicleType: row.vehicle_type,
    basePrice: Number(row.base_price),
    pricePerKm: Number(row.price_per_km),
    minPrice: Number(row.min_price),
  };
}

export async function listRates(): Promise<(Rate & { id: number })[]> {
  const { data, error } = await supabase
    .from("rates")
    .select("*")
    .order("vehicle_type", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map(rateRowToUi);
}

export async function upsertRate(rate: Rate): Promise<Rate & { id: number }> {
  const vehicleType = rate.vehicleType as VehicleType;
  const payload: RateInsert = {
    vehicle_type: vehicleType,
    base_price: rate.basePrice,
    price_per_km: rate.pricePerKm,
    min_price: rate.minPrice ?? 0,
    updated_at: new Date().toISOString(),
  };

  const { data: existing } = await supabase
    .from("rates")
    .select("id")
    .eq("vehicle_type", vehicleType)
    .maybeSingle();

  if (existing?.id != null) {
    const { data, error } = await supabase
      .from("rates")
      .update(payload)
      .eq("id", existing.id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return rateRowToUi(data);
  }

  const { data, error } = await supabase
    .from("rates")
    .insert(payload)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rateRowToUi(data);
}

export async function updateRateByVehicleType(
  vehicleType: string,
  changes: Partial<Rate>,
): Promise<Rate & { id: number }> {
  const updates: Database["public"]["Tables"]["rates"]["Update"] = {
    updated_at: new Date().toISOString(),
  };
  if (changes.basePrice != null) updates.base_price = changes.basePrice;
  if (changes.pricePerKm != null) updates.price_per_km = changes.pricePerKm;
  if (changes.minPrice != null) updates.min_price = changes.minPrice;

  const { data, error } = await supabase
    .from("rates")
    .update(updates)
    .eq("vehicle_type", vehicleType as VehicleType)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return rateRowToUi(data);
}

export async function deleteRateByVehicleType(
  vehicleType: string,
): Promise<void> {
  const { error } = await supabase
    .from("rates")
    .delete()
    .eq("vehicle_type", vehicleType as VehicleType);

  if (error) throw new Error(error.message);
}
