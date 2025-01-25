"use client"

import { useEffect, useMemo } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "../../../components/ui/data-table"
import { columns as columnsDefinition } from "./columns"
import { useRatesStore } from "../../../lib/ratesStore"
import type { VehicleCategory } from "../../../lib/types"
import { useToast } from "../../../components/ui/toast"

export default function RatesPage() {
  const { rates, fetchRates, error } = useRatesStore()
  const { toast } = useToast()

  const columns = useMemo(() => columnsDefinition as (ColumnDef<VehicleCategory, unknown> & { 
    accessorFn: (row: VehicleCategory) => unknown 
  })[], [])

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchRates()
      } catch {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Erreur lors du chargement des tarifs",
        })
      }
    }
    loadData()
  }, [fetchRates, toast])

  useEffect(() => {
    if (error) {
      if (typeof error === 'string' && error.includes("duplicate key")) {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Un tarif existe déjà pour ce type de véhicule",
        })
      } else {
        toast({
          variant: "destructive",
          title: "Erreur",
          description: error?.toString() || "Une erreur est survenue",
        })
      }
    }
  }, [error, toast])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Gestion des tarifs</h1>
      </div>
      
      <DataTable
        columns={columns}
        data={rates || []}
        searchKey="type"
      />
    </div>
  )
}
