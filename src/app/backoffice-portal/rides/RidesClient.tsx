"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useDriversStore } from "@/lib/stores/driversStore";
import { RidesList } from "@/components/admin/rides/RidesList";
import { RidesFilters } from "@/components/admin/rides/RidesFilters";
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore";

export default function RidesPage() {
  const searchParams = useSearchParams();
  const { fetchDrivers } = useDriversStore();
  const { fetchRides, setSelectedStatus, setViewMode, setSelectedDate } =
    useUnifiedRidesStore();

  useEffect(() => {
    fetchDrivers();
    fetchRides();
  }, [fetchDrivers, fetchRides]);

  useEffect(() => {
    const filter = searchParams?.get("filter");
    if (filter === "remaining") {
      // Closest filter for pending + scheduled (metrics "remaining")
      setSelectedStatus("all");
      setViewMode("month");
      setSelectedDate(new Date());
    } else if (filter === "pending") {
      setSelectedStatus("pending");
    }
  }, [searchParams, setSelectedStatus, setViewMode, setSelectedDate]);

  return (
    <div className="py-1 space-y-2">
      <RidesFilters />
      <RidesList />
    </div>
  );
}
