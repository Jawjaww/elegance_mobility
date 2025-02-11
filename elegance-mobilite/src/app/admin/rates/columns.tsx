import { Button } from "@/components/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { RateForm } from "./RateForm";
import type { Rate } from "@/lib/services/pricingService";
import { Euro } from "lucide-react";

interface ColumnsProps {
  onSave: (vehicleType: string, changes: Partial<Rate>) => Promise<void>;
  onDelete: (vehicleType: string) => Promise<void>;
}

export const columns = ({ onSave, onDelete }: ColumnsProps): ColumnDef<Rate>[] => [
  {
    accessorKey: "vehicleType",
    header: "Type de véhicule",
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("vehicleType")}</div>
    ),
  },
  {
    accessorKey: "basePrice",
    header: "Prix de base",
    cell: ({ row }) => (
      <div className="flex items-center">
        <Euro className="mr-1 h-4 w-4" />
        {Number(row.getValue("basePrice")).toFixed(2)}
      </div>
    ),
  },
  {
    accessorKey: "pricePerKm",
    header: "Prix par km",
    cell: ({ row }) => (
      <div className="flex items-center">
        <Euro className="mr-1 h-4 w-4" />
        {Number(row.getValue("pricePerKm")).toFixed(2)}
      </div>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const rate = row.original;

      return (
        <div className="flex items-center gap-2">
          <RateForm
            mode="edit"
            initialData={rate}
            onSubmit={async (updatedRate) => {
              const changes: Partial<Rate> = {
                pricePerKm: updatedRate.pricePerKm,
                basePrice: updatedRate.basePrice,
              };
              await onSave(rate.vehicleType, changes);
            }}
          />
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (window.confirm("Êtes-vous sûr de vouloir supprimer ce tarif ?")) {
                onDelete(rate.vehicleType);
              }
            }}
          >
            Supprimer
          </Button>
        </div>
      );
    },
  },
];