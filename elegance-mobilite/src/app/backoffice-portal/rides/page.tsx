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
    <div className="py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Gestion des Courses</h1>
      </div>
      
      <RidesFilters />
      <RidesList />
    </div>
  )
}