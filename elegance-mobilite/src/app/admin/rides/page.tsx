"use client"

import { useEffect } from "react"
import { useDriversStore } from "@/lib/driversStore"
import { RidesList } from "@/components/admin/rides/RidesList"
import { RidesFilters } from "@/components/admin/rides/RidesFilters"

export default function RidesPage() {
  const { fetchDrivers } = useDriversStore()

  useEffect(() => {
    fetchDrivers()
  }, [fetchDrivers])

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des Courses</h1>
          <p className="text-gray-400 mt-1">
            Consultez et gérez toutes les courses depuis cette interface unifiée
          </p>
        </div>

        <RidesFilters />
        <RidesList />
      </div>
    </div>
  )
}
