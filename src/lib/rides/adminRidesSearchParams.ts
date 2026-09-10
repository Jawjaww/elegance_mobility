import { format } from "date-fns";
import type { AdminRidesStatusFilter } from "@/lib/rides/fetchAdminRidesChunk";

export type AdminRidesFilterStatus = AdminRidesStatusFilter;

const STATUS_QUERY_VALUES = new Set<string>([
  "pending",
  "scheduled",
  "in-progress",
  "completed",
  "client-canceled",
  "driver-canceled",
  "admin-canceled",
  "no-show",
  "delayed",
  "canceled",
]);

export type AdminRidesUrlFilters = {
  selectedDate: Date;
  viewMode: "day" | "month";
  selectedStatus: AdminRidesFilterStatus;
  driverFilter: string | null;
  clientFilter: string | null;
  searchQuery: string;
};

function parseLocalDate(value: string | null): Date | null {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function parseAdminRidesSearchParams(
  searchParams: URLSearchParams,
): Partial<AdminRidesUrlFilters> {
  const parsed: Partial<AdminRidesUrlFilters> = {};
  const filter = searchParams.get("filter");
  const view = searchParams.get("view");
  const date = parseLocalDate(searchParams.get("date"));
  const driver = searchParams.get("driver");
  const client = searchParams.get("client");
  const q = searchParams.get("q");

  parsed.driverFilter = driver;
  parsed.clientFilter = client;
  parsed.searchQuery = q ?? "";

  if (filter && STATUS_QUERY_VALUES.has(filter)) {
    parsed.selectedStatus = filter as AdminRidesFilterStatus;
  } else if (filter === "remaining") {
    parsed.selectedStatus = "all";
    parsed.viewMode = "month";
    parsed.selectedDate = new Date();
  } else if (!filter) {
    parsed.selectedStatus = "all";
  }

  if (view === "day" || view === "month") {
    parsed.viewMode = view;
  }
  if (date) parsed.selectedDate = date;

  return parsed;
}

export function buildAdminRidesSearchParams(
  filters: AdminRidesUrlFilters,
): string {
  const params = new URLSearchParams();
  if (filters.selectedStatus !== "all") {
    params.set("filter", filters.selectedStatus);
  }
  params.set("view", filters.viewMode);
  params.set("date", format(filters.selectedDate, "yyyy-MM-dd"));
  if (filters.driverFilter) params.set("driver", filters.driverFilter);
  if (filters.clientFilter) params.set("client", filters.clientFilter);
  const q = filters.searchQuery.trim();
  if (q) params.set("q", q);
  return params.toString();
}
