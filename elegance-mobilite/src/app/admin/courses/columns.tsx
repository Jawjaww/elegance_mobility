import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

export interface Ride {
  id: string
  clientName: string
  pickupAddress: string
  dropoffAddress: string
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled'
  driverId: string | null
  createdAt: string
}

export const columns: ColumnDef<Ride>[] = [
  {
    accessorKey: "clientName",
    header: "Client",
  },
  {
    accessorKey: "pickupAddress",
    header: "Adresse de prise en charge",
  },
  {
    accessorKey: "dropoffAddress",
    header: "Adresse de destination",
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusMap
      const statusMap = {
        pending: 'En attente',
        'in-progress': 'En cours',
        completed: 'Terminée',
        cancelled: 'Annulée'
      }
      return <div>{statusMap[status]}</div>
    }
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt"))
      return <div>{date.toLocaleString('fr-FR')}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const ride = row.original

      return (
        <Button
          variant="ghost"
          onClick={() => console.log("Edit ride", ride.id)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )
    }
  }
]
