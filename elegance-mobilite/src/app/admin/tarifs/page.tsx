"use client"

import { DataTable } from "@/components/ui/data-table"
import { columns } from "./columns"
import { useEffect } from "react"
import { useRatesStore } from "../../../lib/ratesStore"

export default function RatesPage() {
  const { rates, fetchRates } = useRatesStore()

  useEffect(() => {
    fetchRates()
  }, [fetchRates])
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des rates</h1>
      </div>
      
      <DataTable
        columns={columns}
        data={rates}
        searchKey="type"
      />
    </div>
  )
}