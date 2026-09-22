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
  /**
   * Account email, resolved from `auth.users` by the admin-only RPC
   * `admin_driver_account_emails`. `null` when the RPC is unavailable or the dossier has no
   * auth user — never rendered as an empty string, so a missing email is never mistaken for a
   * blank one.
   */
  account_email: string | null;
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

/**
 * Resolve the account email of each given dossier.
 *
 * The email is what tells two same-named drivers apart, and it only exists in `auth.users`,
 * which the browser client cannot read however privileged the signed-in account is. The
 * admin-only RPC `admin_driver_account_emails` reads it server-side.
 *
 * One batch call rather than one per driver: the caller resolves a whole page at once (the
 * driver list), or a single dossier (the folder page). A failure is not fatal — the backoffice
 * must keep working on name and phone, and a cloud deploy can lag the app — so it degrades to an
 * empty map exactly like the vehicle summaries above.
 */
export async function fetchDriverAccountEmails(
  driverIds: string[],
): Promise<Map<string, string>> {
  const byDriverId = new Map<string, string>();
  const uniqueIds = Array.from(new Set(driverIds.filter(Boolean)));
  if (uniqueIds.length === 0) return byDriverId;

  const { data, error } = await supabase.rpc("admin_driver_account_emails", {
    p_driver_ids: uniqueIds,
  });

  if (error) {
    console.warn("[adminDrivers] account emails fetch failed:", error.message);
    return byDriverId;
  }

  for (const row of data ?? []) {
    byDriverId.set(row.driver_id, row.email);
  }
  return byDriverId;
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

  const [vehiclesById, emailsByDriverId] = await Promise.all([
    fetchVehicleSummariesById(vehicleIds),
    fetchDriverAccountEmails(rows.map((driver) => driver.id)),
  ]);

  return rows.map((driver) => ({
    ...driver,
    current_vehicle: driver.current_vehicle_id
      ? (vehiclesById.get(driver.current_vehicle_id) ?? null)
      : null,
    account_email: emailsByDriverId.get(driver.id) ?? null,
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
    const email = (driver.account_email ?? "").toLowerCase();
    const license = (driver.driving_license_number ?? "").toLowerCase();
    const vehicle =
      vehicleSummaryLabel(driver.current_vehicle)?.toLowerCase() ?? "";

    // The email belongs in the search: it is the one field that distinguishes two drivers with
    // the same name, and finding the right one of those is the reason it is displayed at all.
    return (
      name.includes(query) ||
      phone.includes(query) ||
      email.includes(query) ||
      license.includes(query) ||
      vehicle.includes(query)
    );
  });
}
