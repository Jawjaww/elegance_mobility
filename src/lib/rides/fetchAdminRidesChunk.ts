import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database.types";
import { overdueUnassignedOrFilter } from "@/lib/dashboard/adminDashboard";

export const ADMIN_RIDES_PAGE_SIZE = 20;
export const ADMIN_RIDES_QUERY_KEY = "admin-rides";

type RideStatus = Database["public"]["Enums"]["ride_status"];

export const CANCELED_RIDE_STATUSES: RideStatus[] = [
  "client-canceled",
  "driver-canceled",
  "admin-canceled",
];

export type AdminRidesStatusFilter = RideStatus | "all" | "canceled";

export type AdminRideListPerson = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

export type AdminRideListRow = {
  id: string;
  status: RideStatus;
  pickup_time: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_price: number | null;
  vehicle_type: string | null;
  driver_id: string | null;
  user_id: string | null;
  canceled_by: string | null;
  cancel_billing: string | null;
  delay_kind: string | null;
  matching_paused_at: string | null;
  matching_deadline_at: string | null;
  driver: AdminRideListPerson | null;
  customer: AdminRideListPerson | null;
};

export type AdminRidesCursor = {
  pickup_time: string;
  id: string;
};

export type AdminRidesChunkParams = {
  startIso: string;
  endIso: string;
  status?: AdminRidesStatusFilter;
  driverId?: string | null;
  clientId?: string | null;
  searchQuery?: string;
  cursor?: AdminRidesCursor | null;
  limit?: number;
};

const LIST_SELECT = [
  "id",
  "status",
  "pickup_time",
  "pickup_address",
  "dropoff_address",
  "estimated_price",
  "vehicle_type",
  "driver_id",
  "user_id",
  "canceled_by",
  "cancel_billing",
  "delay_kind",
  "matching_paused_at",
  "matching_deadline_at",
  "driver:drivers(id, first_name, last_name, phone)",
  "customer:users!rides_user_id_fkey(id, first_name, last_name, phone)",
].join(", ");

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Inclusive start, exclusive end — matches the admin calendar window. */
export function pickupWindow(
  selectedDate: Date,
  viewMode: "day" | "month",
): { start: Date; end: Date } {
  if (viewMode === "month") {
    const start = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1,
    );
    const end = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      1,
    );
    return { start, end };
  }
  const start = new Date(
    selectedDate.getFullYear(),
    selectedDate.getMonth(),
    selectedDate.getDate(),
  );
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function pgFilterValue(value: string): string {
  return `"${value.replaceAll('"', "")}"`;
}

/** Keyset: (pickup_time, id) > cursor, ascending. */
export function adminRidesKeysetOr(cursor: AdminRidesCursor): string {
  const time = pgFilterValue(cursor.pickup_time);
  const id = pgFilterValue(cursor.id);
  return `pickup_time.gt.${time},and(pickup_time.eq.${time},id.gt.${id})`;
}

export function adminRidesSearchOrFilter(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (UUID_RE.test(trimmed)) {
    return `id.eq.${trimmed}`;
  }
  const like = `%${trimmed.replaceAll("%", "").replaceAll(",", " ")}%`;
  const encoded = pgFilterValue(like);
  return `pickup_address.ilike.${encoded},dropoff_address.ilike.${encoded}`;
}

export function nextAdminRidesCursor(
  page: ReadonlyArray<Pick<AdminRideListRow, "pickup_time" | "id">>,
  limit: number,
): AdminRidesCursor | undefined {
  if (page.length < limit) return undefined;
  const last = page.at(-1);
  if (!last) return undefined;
  return { pickup_time: last.pickup_time, id: last.id };
}

function firstEmbed<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value.at(0) ?? null) : value;
}

export function normalizeAdminRideRow(row: {
  id: string;
  status: RideStatus;
  pickup_time: string;
  pickup_address: string;
  dropoff_address: string;
  estimated_price: number | null;
  vehicle_type: string | null;
  driver_id: string | null;
  user_id: string | null;
  canceled_by: string | null;
  cancel_billing?: string | null;
  delay_kind?: string | null;
  matching_paused_at?: string | null;
  matching_deadline_at?: string | null;
  driver?: AdminRideListPerson | AdminRideListPerson[] | null;
  customer?: AdminRideListPerson | AdminRideListPerson[] | null;
}): AdminRideListRow {
  return {
    id: row.id,
    status: row.status,
    pickup_time: row.pickup_time,
    pickup_address: row.pickup_address,
    dropoff_address: row.dropoff_address,
    estimated_price: row.estimated_price,
    vehicle_type: row.vehicle_type,
    driver_id: row.driver_id,
    user_id: row.user_id,
    canceled_by: row.canceled_by,
    cancel_billing: row.cancel_billing ?? null,
    delay_kind: row.delay_kind ?? null,
    matching_paused_at: row.matching_paused_at ?? null,
    matching_deadline_at: row.matching_deadline_at ?? null,
    driver: firstEmbed(row.driver),
    customer: firstEmbed(row.customer),
  };
}

export async function fetchAdminRidesChunk(
  client: SupabaseClient<Database>,
  params: AdminRidesChunkParams,
): Promise<AdminRideListRow[]> {
  const limit = params.limit ?? ADMIN_RIDES_PAGE_SIZE;

  let query = client.from("rides").select(LIST_SELECT);

  if (params.status !== "delayed") {
    query = query
      .gte("pickup_time", params.startIso)
      .lt("pickup_time", params.endIso);
  }

  query = query
    .order("pickup_time", { ascending: true })
    .order("id", { ascending: true })
    .limit(limit);

  if (params.status === "canceled") {
    query = query.in("status", CANCELED_RIDE_STATUSES);
  } else if (params.status === "delayed") {
    query = query.or(overdueUnassignedOrFilter(new Date().toISOString()));
  } else if (params.status && params.status !== "all") {
    query = query.eq("status", params.status);
  }
  if (params.driverId) {
    query = query.eq("driver_id", params.driverId);
  }
  if (params.clientId) {
    query = query.eq("user_id", params.clientId);
  }
  if (params.cursor) {
    query = query.or(adminRidesKeysetOr(params.cursor));
  }
  const searchOr = adminRidesSearchOrFilter(params.searchQuery ?? "");
  if (searchOr) {
    query = query.or(searchOr);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? []).map((row) =>
    normalizeAdminRideRow(
      row as unknown as Parameters<typeof normalizeAdminRideRow>[0],
    ),
  );
}
