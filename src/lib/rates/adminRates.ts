import type { Rate } from "@/lib/services/pricingService";
import type { Database } from "@/lib/types/database.types";

type VehicleType = Database["public"]["Enums"]["vehicle_type_enum"];

export type RateRow = Rate & { id: number };

const VEHICLE_TYPE_LABELS: Record<VehicleType, string> = {
  STANDARD: "Standard",
  PREMIUM: "Premium",
  VAN: "Van",
  ELECTRIC: "Électrique",
};

const VEHICLE_TYPE_COLORS: Record<VehicleType, string> = {
  STANDARD: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  PREMIUM: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  VAN: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  ELECTRIC: "bg-green-500/20 text-green-400 border-green-500/30",
};

export function vehicleTypeLabel(vehicleType: string): string {
  return (
    VEHICLE_TYPE_LABELS[vehicleType as VehicleType] ?? vehicleType
  );
}

export function vehicleTypeBadgeClass(vehicleType: string): string {
  return (
    VEHICLE_TYPE_COLORS[vehicleType as VehicleType] ??
    "bg-neutral-500/20 text-neutral-400 border-neutral-500/30"
  );
}

export function formatRatePrice(price: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(price);
}

export function filterRates(rates: RateRow[], search: string): RateRow[] {
  const query = search.trim().toLowerCase();
  if (!query) return rates;

  return rates.filter((rate) => {
    const type = rate.vehicleType.toLowerCase();
    const label = vehicleTypeLabel(rate.vehicleType).toLowerCase();
    return type.includes(query) || label.includes(query);
  });
}
