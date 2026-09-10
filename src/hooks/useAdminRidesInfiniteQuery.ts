"use client";

import { useEffect, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/database/client";
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore";
import {
  ADMIN_RIDES_PAGE_SIZE,
  ADMIN_RIDES_QUERY_KEY,
  fetchAdminRidesChunk,
  nextAdminRidesCursor,
  pickupWindow,
  type AdminRidesCursor,
} from "@/lib/rides/fetchAdminRidesChunk";

export function useAdminRidesInfiniteQuery() {
  const selectedDate = useUnifiedRidesStore((s) => s.selectedDate);
  const viewMode = useUnifiedRidesStore((s) => s.viewMode);
  const selectedStatus = useUnifiedRidesStore((s) => s.selectedStatus);
  const driverFilter = useUnifiedRidesStore((s) => s.driverFilter);
  const clientFilter = useUnifiedRidesStore((s) => s.clientFilter);
  const searchQuery = useUnifiedRidesStore((s) => s.searchQuery);
  const filtersReady = useUnifiedRidesStore((s) => s.filtersReady);

  const [debouncedQ, setDebouncedQ] = useState(searchQuery.trim());
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(searchQuery.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { start, end } = pickupWindow(selectedDate, viewMode);
  const startIso = start.toISOString();
  const endIso = end.toISOString();

  return useInfiniteQuery({
    queryKey: [
      ADMIN_RIDES_QUERY_KEY,
      {
        startIso,
        endIso,
        status: selectedStatus,
        driverId: driverFilter,
        clientId: clientFilter,
        q: debouncedQ,
      },
    ],
    queryFn: ({ pageParam }) =>
      fetchAdminRidesChunk(supabase, {
        startIso,
        endIso,
        status: selectedStatus,
        driverId: driverFilter,
        clientId: clientFilter,
        searchQuery: debouncedQ,
        cursor: pageParam,
        limit: ADMIN_RIDES_PAGE_SIZE,
      }),
    initialPageParam: null as AdminRidesCursor | null,
    enabled: filtersReady,
    getNextPageParam: (lastPage) =>
      nextAdminRidesCursor(lastPage, ADMIN_RIDES_PAGE_SIZE),
  });
}
