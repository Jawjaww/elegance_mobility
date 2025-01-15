"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash } from "lucide-react"

import { Rate } from "../../../lib/types"

export const columns: ColumnDef<Rate>[] = [
  {
    accessorKey: "type",
    header: "Type"
  },
  {
    accessorKey: "baseRate",
    header: "Tarif de base (€/km)",
    cell: ({ row }) => row.original.baseRate + " €/km"
  },
  {
    accessorKey: "peakRate",
    header: "Heure pleine (€/km)",
    cell: ({ row }) => row.original.peakRate + " €/km"
  },
  {
    accessorKey: "nightRate",
    header: "Nuit (€/km)",
    cell: ({ row }) => row.original.nightRate + " €/km"
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const rate = row.original
      
      const updateRate = (id: string, newRate: Partial<Rate>) => {
        console.log('Updating rate:', id, newRate)
        // TODO: Implémenter la mise à jour via un contexte ou state management
      }
      
      const handleEdit = () => {
        const newBaseRate = parseFloat(prompt("Nouveau tarif de base (€/km):", (rate.baseRate || 0).toString()) || '0')
        const newPeakRate = parseFloat(prompt("Nouveau tarif heure pleine (€/km):", (rate.peakRate || 0).toString()) || '0')
        const newNightRate = parseFloat(prompt("Nouveau tarif nuit (€/km):", (rate.nightRate || 0).toString()) || '0')
        
        if (!isNaN(newBaseRate) && !isNaN(newPeakRate) && !isNaN(newNightRate)) {
          updateRate(rate.id, {
            baseRate: newBaseRate,
            peakRate: newPeakRate,
            nightRate: newNightRate
          })
        } else {
          alert("Veuillez entrer des valeurs numériques valides")
        }
      }

      const handleDelete = () => {
        // TODO: Implémenter la logique de suppression
        console.log('Supprimer le rate:', rate)
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
  }
]
