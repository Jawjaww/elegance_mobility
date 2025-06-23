"use client"

import { useEffect } from "react"
import { useDriversAdmin } from "@/hooks/queries"
import { RidesList } from "@/components/admin/rides/RidesList"
import { RidesFilters } from "@/components/admin/rides/RidesFilters"
import { useUnifiedRidesStore } from "@/lib/stores/unifiedRidesStore"

export default function RidesPage() {
  const { data: drivers, isLoading } = useDriversAdmin()
  const { fetchRides } = useUnifiedRidesStore()

  useEffect(() => {
    // TanStack Query handles driver fetching automatically
    // Only need to fetch rides from the legacy store
    fetchRides()
  }, [fetchRides])

  return (
    <div className="py-1 space-y-2">
      <RidesFilters />
      <RidesList />
    </div>
  )
}