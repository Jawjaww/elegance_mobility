"use client"

import { useEffect } from "react"
import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { useRidesStore } from "@/lib/ridesStore"

export default function RidesPage() {
  const { rides, fetchRides } = useRidesStore()

  useEffect(() => {
    fetchRides()
  }, [fetchRides])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des courses</h1>
      </div>
      
      <DataTable
        columns={columns}
        data={rides}
        searchKey="clientName"
        searchPlaceholder="Rechercher par client..."
      />
    </div>
  )
}
