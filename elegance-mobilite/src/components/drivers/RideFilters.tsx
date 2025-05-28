import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import type { FilterRideStatus } from '@/lib/types/common.types'

// Définir les options avec le bon typage
const statusOptions: Array<{ label: string; value: FilterRideStatus }> = [
  { label: "Toutes", value: "all" },
  { label: "En attente", value: "pending" },
  { label: "Programmées", value: "scheduled" },
  { label: "En cours", value: "in-progress" },
  { label: "Terminées", value: "completed" },
  { label: "Annulées (client)", value: "client-canceled" },
  { label: "Annulées (chauffeur)", value: "driver-canceled" },
  { label: "Annulées (admin)", value: "admin-canceled" },
  { label: "No-show", value: "no-show" },
  { label: "Retardées", value: "delayed" }
];

interface RideFiltersProps {
  onFilterChange: (status: FilterRideStatus) => void;
  defaultValue?: FilterRideStatus;
  counts?: Record<FilterRideStatus, number>;
}

export function RideFilters({ onFilterChange, defaultValue = "all", counts }: RideFiltersProps) {
  return (
    <div className="flex flex-col space-y-2">
      <Label htmlFor="status-filter">Statut</Label>
      <Select 
        defaultValue={defaultValue} 
        onValueChange={(value) => onFilterChange(value as FilterRideStatus)}
      >
        <SelectTrigger id="status-filter" className="w-full sm:w-[180px]">
          <SelectValue placeholder="Choisir un statut" />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(({ label, value }) => (
            <SelectItem key={value} value={value}>
              {label} {counts && counts[value] > 0 && `(${counts[value]})`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}