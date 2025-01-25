import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Pencil } from "lucide-react"

export interface Option {
  id: string
  name: string
  price: number
}

export const columns: ColumnDef<Option>[] = [
  {
    accessorKey: "name",
    header: "Nom",
  },
  {
    accessorKey: "price",
    header: "Prix",
    cell: ({ row }) => {
      const price = parseFloat(row.getValue("price"))
      const formatted = new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
      }).format(price)

      return <div>{formatted}</div>
    }
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const option = row.original

      return (
        <Button
          variant="ghost"
          onClick={() => console.log("Edit option", option.id)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      )
    }
  }
]
