import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Pencil } from "lucide-react"

export interface Driver {
  id: string
  firstName: string
  lastName: string
  licenseNumber: string
  status: 'available' | 'on-duty' | 'off-duty'
  avatar_url?: string | null
}

export const columns: ColumnDef<Driver>[] = [
  {
    accessorKey: "avatar",
    header: "",
    cell: ({ row }) => {
      const driver = row.original
      return (
        <Avatar className="h-10 w-10">
          <AvatarImage src={driver.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-sm">
            {driver.firstName?.[0]}{driver.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      )
    }
  },
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
        available: { label: 'Disponible', variant: 'success' },
        'on-duty': { label: 'En service', variant: 'default' },
        'off-duty': { label: 'Hors service', variant: 'secondary' }
      }
      const statusInfo = statusMap[status] || { label: status, variant: 'secondary' }
      return (
        <Badge variant={statusInfo.variant as any}>
          {statusInfo.label}
        </Badge>
      )
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
