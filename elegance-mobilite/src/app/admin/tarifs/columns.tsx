"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "../../../components/ui/button"
import { Pencil, Trash } from "lucide-react"

import { VehicleCategory } from "../../../lib/types"
import { useRatesStore } from "../../../lib/ratesStore"

export const columns: ColumnDef<VehicleCategory, unknown>[] = [
  {
    id: "type",
    accessorFn: (row) => row.type,
    header: "Type",
    cell: ({ row }) => {
      const typeMap: Record<VehicleCategory['type'], string> = {
        STANDARD: 'Standard',
        PREMIUM: 'Premium',
        VIP: 'VIP'
      }
      return typeMap[row.original.type]
    }
  },
  {
    id: "baseRate",
    accessorFn: (row) => row.baseRate,
    header: "Tarif de base (€/km)",
    cell: ({ row }) => row.original.baseRate + " €/km"
  },
  {
    id: "peakRate",
    accessorFn: (row) => row.peakRate,
    header: "Heure pleine (€/km)", 
    cell: ({ row }) => row.original.peakRate + " €/km"
  },
  {
    id: "nightRate",
    accessorFn: (row) => row.nightRate,
    header: "Nuit (€/km)",
    cell: ({ row }) => row.original.nightRate + " €/km"
  },
  {
    id: "actions",
    accessorFn: (row) => row.id,
    cell: ({ row }) => <ActionsCell rate={row.original} />
  }
]

const ActionsCell = ({ rate }: { rate: VehicleCategory }) => {
  const { updateRate } = useRatesStore()
  
  const handleEdit = () => {
    const updates: Partial<VehicleCategory> = {}
    
    const baseRateInput = prompt("Tarif de base (€/km) [Laisser vide pour ne pas modifier]:", rate.baseRate?.toString())
    if (baseRateInput !== null && baseRateInput !== "") {
      const newBaseRate = parseFloat(baseRateInput)
      if (!isNaN(newBaseRate)) {
        updates.baseRate = newBaseRate
      }
    }

    const peakRateInput = prompt("Tarif heure pleine (€/km) [Laisser vide pour ne pas modifier]:", rate.peakRate?.toString())
    if (peakRateInput !== null && peakRateInput !== "") {
      const newPeakRate = parseFloat(peakRateInput)
      if (!isNaN(newPeakRate)) {
        updates.peakRate = newPeakRate
      }
    }

    const nightRateInput = prompt("Tarif nuit (€/km) [Laisser vide pour ne pas modifier]:", rate.nightRate?.toString())
    if (nightRateInput !== null && nightRateInput !== "") {
      const newNightRate = parseFloat(nightRateInput)
      if (!isNaN(newNightRate)) {
        updates.nightRate = newNightRate
      }
    }

    if (Object.keys(updates).length > 0) {
      updateRate(rate.id, updates)
    } else {
      alert("Aucune modification effectuée")
    }
  }

  const handleDelete = () => {
    console.log('Supprimer la catégorie:', rate)
  }

  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleEdit}
      >
        <Pencil className="h-4 w-4 mr-2" />
        Modifier
      </Button>
      <Button 
        variant="destructive" 
        size="sm"
        onClick={handleDelete}
      >
        <Trash className="h-4 w-4 mr-2" />
        Supprimer
      </Button>
    </div>
  )
}
