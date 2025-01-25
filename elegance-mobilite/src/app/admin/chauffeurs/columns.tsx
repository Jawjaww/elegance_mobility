import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

export interface Driver {
  id: string
  firstName: string
  lastName: string
  licenseNumber: string
  status: 'available' | 'on-duty' | 'off-duty'
}

export const columns: ColumnDef<Driver>[] = [
  {
    accessorKey: "firstName",
    header: "Prénom",
  },
  {
    accessorKey: "lastName",
    header: "Nom",
  },
  {
    accessorKey: "licenseNumber",
    header: "Numéro de permis",
  },
  {
    accessorKey: "status",
    header: "Statut",
    cell: ({ row }) => {
      const status = row.getValue("status") as keyof typeof statusMap
      const statusMap = {
        available: 'Disponible',
        'on-duty': 'En service',
        'off-duty': 'Hors service'
      }
      return <div>{statusMap[status]}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const driver = row.original

      return (
        <Button
          variant="ghost"
          onClick={() => console.log("Edit driver", driver.id)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )
    }
  }
]
