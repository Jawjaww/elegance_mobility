"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDriversStore } from "@/lib/stores/driversStore";
import { RidesList } from "@/components/admin/rides/RidesList";
import { RidesFilters } from "@/components/admin/rides/RidesFilters";
import { RidesQueueSummary } from "@/components/admin/rides/RidesQueueSummary";
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore";
import {
  buildAdminRidesSearchParams,
  parseAdminRidesSearchParams,
} from "@/lib/rides/adminRidesSearchParams";

export default function RidesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { fetchDrivers } = useDriversStore();
  const [hydrated, setHydrated] = useState(false);
  const selectedDate = useUnifiedRidesStore((s) => s.selectedDate);
  const selectedStatus = useUnifiedRidesStore((s) => s.selectedStatus);
  const driverFilter = useUnifiedRidesStore((s) => s.driverFilter);
  const clientFilter = useUnifiedRidesStore((s) => s.clientFilter);
  const searchQuery = useUnifiedRidesStore((s) => s.searchQuery);
  const viewMode = useUnifiedRidesStore((s) => s.viewMode);
  const setSelectedStatus = useUnifiedRidesStore((s) => s.setSelectedStatus);
  const setViewMode = useUnifiedRidesStore((s) => s.setViewMode);
  const setSelectedDate = useUnifiedRidesStore((s) => s.setSelectedDate);
  const setDriverFilter = useUnifiedRidesStore((s) => s.setDriverFilter);
  const setClientFilter = useUnifiedRidesStore((s) => s.setClientFilter);
  const setSearchQuery = useUnifiedRidesStore((s) => s.setSearchQuery);
  const setFiltersReady = useUnifiedRidesStore((s) => s.setFiltersReady);

  useEffect(() => {
    void fetchDrivers();
  }, [fetchDrivers]);

  useEffect(() => {
    const parsed = parseAdminRidesSearchParams(
      new URLSearchParams(searchParams?.toString() ?? ""),
    );
    if (parsed.selectedStatus) setSelectedStatus(parsed.selectedStatus);
    if (parsed.viewMode) setViewMode(parsed.viewMode);
    if (parsed.selectedDate) setSelectedDate(parsed.selectedDate);
    setDriverFilter(parsed.driverFilter ?? null);
    setClientFilter(parsed.clientFilter ?? null);
    setSearchQuery(parsed.searchQuery ?? "");
    setHydrated(true);
    setFiltersReady(true);
  }, [
    searchParams,
    setSelectedStatus,
    setViewMode,
    setSelectedDate,
    setDriverFilter,
    setClientFilter,
    setSearchQuery,
    setFiltersReady,
  ]);

  useEffect(() => {
    return () => setFiltersReady(false);
  }, [setFiltersReady]);

  useEffect(() => {
    if (!hydrated) return;
    const next = buildAdminRidesSearchParams({
      selectedDate,
      viewMode,
      selectedStatus,
      driverFilter,
      clientFilter,
      searchQuery,
    });
    const current = searchParams?.toString() ?? "";
    if (next === current) return;
    router.replace(`${pathname}?${next}`, { scroll: false });
  }, [
    hydrated,
    selectedDate,
    viewMode,
    selectedStatus,
    driverFilter,
    clientFilter,
    searchQuery,
    pathname,
    router,
    searchParams,
  ]);

  return (
    <div className="py-1 space-y-2">
      <RidesQueueSummary />
      <RidesFilters />
      <RidesList />
    </div>
  );
}
