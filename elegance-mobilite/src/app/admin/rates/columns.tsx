import { ColumnDef, CellContext } from "@tanstack/react-table"
import { Button } from "../../../components/ui/button"
import { ArrowUpDown } from "lucide-react"
import type { VehicleCategory } from "../../../lib/types"

interface ColumnsProps {
  handleDelete: (id: string) => void;
}

export const columns = ({ handleDelete }: ColumnsProps): ColumnDef<VehicleCategory>[] => [
  {
    accessorKey: "type",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Type
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "baseRate",
    header: "Tarif de base",
  },
  {
    accessorKey: "peakRate",
    header: "Tarif heure de pointe",
  },
  {
    accessorKey: "nightRate",
    header: "Tarif de nuit",
  },
  {
    id: "actions",
    cell: ({ row }: CellContext<VehicleCategory, unknown>) => {
      const rate = row.original;
      return (
        <Button variant="destructive" size="sm" onClick={() => handleDelete(rate.id)}>
          Supprimer
        </Button>
      );
    },
  },
];