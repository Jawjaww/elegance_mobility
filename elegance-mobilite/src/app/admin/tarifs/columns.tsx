"use client"

import * as React from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash } from "lucide-react"

import { Tarif } from "../../../lib/types"

export const columns: ColumnDef<Tarif>[] = [
  {
    accessorKey: "type",
    header: "Type"
  },
  {
    accessorKey: "offPeakRate",
    header: "Heure creuse (€/km)",
    cell: ({ row }) => row.original.offPeakRate + " €/km"
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
      const tarif = row.original
      
      const updateTarif = (id: string, newTarif: Partial<Tarif>) => {
        console.log('Updating tarif:', id, newTarif)
        // TODO: Implémenter la mise à jour via un contexte ou state management
      }
      
      const handleEdit = () => {
        const newOffPeakRate = parseFloat(prompt("Nouveau tarif heure creuse (€/km):", (tarif.offPeakRate || 0).toString()) || '0')
        const newPeakRate = parseFloat(prompt("Nouveau tarif heure pleine (€/km):", (tarif.peakRate || 0).toString()) || '0')
        const newNightRate = parseFloat(prompt("Nouveau tarif nuit (€/km):", (tarif.nightRate || 0).toString()) || '0')
        
        if (!isNaN(newOffPeakRate) && !isNaN(newPeakRate) && !isNaN(newNightRate)) {
          updateTarif(tarif.id, {
            offPeakRate: newOffPeakRate,
            peakRate: newPeakRate,
            nightRate: newNightRate
          })
        } else {
          alert("Veuillez entrer des valeurs numériques valides")
        }
      }

      const handleDelete = () => {
        // TODO: Implémenter la logique de suppression
        console.log('Supprimer le tarif:', tarif)
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
