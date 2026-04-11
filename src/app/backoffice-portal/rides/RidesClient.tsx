"use client"

import { useEffect } from "react"
import { useDriversStore } from "@/lib/stores/driversStore"
import { RidesList } from "@/components/admin/rides/RidesList"
import { RidesFilters } from "@/components/admin/rides/RidesFilters"
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore"

export default function RidesPage() {
  const { fetchDrivers } = useDriversStore()
  const { fetchRides } = useUnifiedRidesStore()

  useEffect(() => {
    fetchDrivers()
    fetchRides()
  }, [fetchDrivers, fetchRides])

  return (
    <div className="py-1 space-y-2">
      <RidesFilters />
      <RidesList />
    </div>
  )
}