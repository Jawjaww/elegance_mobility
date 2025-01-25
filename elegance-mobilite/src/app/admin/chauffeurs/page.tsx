"use client"

import { useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { useDriversStore } from "../../../lib/driversStore"

export default function DriversPage() {
  const { drivers, fetchDrivers } = useDriversStore()

  useEffect(() => {
    fetchDrivers()
  }, [fetchDrivers])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des chauffeurs</h1>
      </div>
      
      <DataTable
        columns={columns}
        data={drivers}
        searchKey="lastName"
        searchPlaceholder="Rechercher par nom..."
      />
    </div>
  )
}
