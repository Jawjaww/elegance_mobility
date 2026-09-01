import { supabase } from "@/lib/database/client";
import type { Database } from "@/lib/types/database.types";
import { formatPersonName } from "@/lib/rides/rideCancelLabels";

type DriverRow = Database["public"]["Tables"]["drivers"]["Row"];
type DriverStatus = Database["public"]["Enums"]["driver_status"];

type VehicleSummary = Pick<
  Database["public"]["Tables"]["vehicles"]["Row"],
  "id" | "make" | "model" | "license_plate"
>;

export type DriverWithVehicle = DriverRow & {
  current_vehicle: VehicleSummary | null;
};

export type DriverStatusFilter = DriverStatus | "all";

export function driverDisplayName(
  driver: Pick<DriverRow, "first_name" | "last_name">,
): string {
  return formatPersonName(driver.first_name, driver.last_name);
}

export function driverDossierPath(driverId: string): string {
  return `/backoffice-portal/drivers/${driverId}/documents`;
}

/** RPC validate_driver_dossier refusal when ops completeness is below 100%. */
export function isIncompleteDossierValidationError(
  message: string | undefined,
): boolean {
  if (!message?.trim()) return false;
  const lower = message.toLowerCase();
  return (
    lower.includes("dossier incomplet") ||
    lower.includes("impossible d'activer")
  );
}

export function vehicleSummaryLabel(
  vehicle: VehicleSummary | null | undefined,
): string | null {
  if (!vehicle) return null;
  const label = `${vehicle.make ?? ""} ${vehicle.model ?? ""}`.trim();
  const plate = vehicle.license_plate?.trim();
  if (label && plate) return `${label} · ${plate}`;
  return label || plate || null;
}

async function fetchVehicleSummariesById(
  vehicleIds: string[],
): Promise<Map<string, VehicleSummary>> {
  if (vehicleIds.length === 0) return new Map();

  const { data, error } = await supabase
    .from("vehicles")
    .select("id, make, model, license_plate")
    .in("id", vehicleIds);

  if (error) {
    console.warn("[adminDrivers] vehicles fetch failed:", error.message);
    return new Map();
  }

  const map = new Map<string, VehicleSummary>();
  for (const vehicle of data ?? []) {
    map.set(vehicle.id, vehicle);
  }
  return map;
}

export async function fetchDriversWithVehicles(): Promise<DriverWithVehicle[]> {
  const { data: drivers, error } = await supabase
    .from("drivers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const rows = drivers ?? [];
  const vehicleIds = Array.from(
    new Set(
      rows
        .map((driver) => driver.current_vehicle_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const vehiclesById = await fetchVehicleSummariesById(vehicleIds);

  return rows.map((driver) => ({
    ...driver,
    current_vehicle: driver.current_vehicle_id
      ? (vehiclesById.get(driver.current_vehicle_id) ?? null)
      : null,
  }));
}

export async function fetchPendingReviewDrivers(): Promise<DriverWithVehicle[]> {
  const drivers = await fetchDriversWithVehicles();
  return drivers.filter((driver) => driver.status === "pending_review");
}

export function filterDrivers(
  drivers: DriverWithVehicle[],
  search: string,
  status: DriverStatusFilter,
): DriverWithVehicle[] {
  const query = search.trim().toLowerCase();

  return drivers.filter((driver) => {
    const matchesStatus = status === "all" || driver.status === status;
    if (!matchesStatus) return false;
    if (!query) return true;

    const name = driverDisplayName(driver).toLowerCase();
    const phone = (driver.phone ?? "").toLowerCase();
    const license = (driver.driving_license_number ?? "").toLowerCase();
    const vehicle =
      vehicleSummaryLabel(driver.current_vehicle)?.toLowerCase() ?? "";

    return (
      name.includes(query) ||
      phone.includes(query) ||
      license.includes(query) ||
      vehicle.includes(query)
    );
  });
}
