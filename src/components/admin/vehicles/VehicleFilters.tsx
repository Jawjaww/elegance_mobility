"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { Database } from "@/lib/types/database.types";

type VehicleType = Database["public"]["Enums"]["vehicle_type_enum"];

type Props = {
  onFilterChange: (filters: {
    type?: VehicleType | "all";
    search?: string;
  }) => void;
};

export function VehicleFilters({ onFilterChange }: Readonly<Props>) {
  const [selectedType, setSelectedType] = useState<VehicleType | "all">("all");

  function handleTypeChange(type: string) {
    const t = type === "all" ? "all" : (type as VehicleType);
    setSelectedType(t);
    onFilterChange({ type: t, search: undefined });
  }

  function handleSearchChange(value: string) {
    onFilterChange({
      type: selectedType as VehicleType | "all",
      search: value,
    });
  }

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Rechercher par plaque, modèle ou chauffeur..."
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="w-48">
        <Select defaultValue="all" onValueChange={(v) => handleTypeChange(v)}>
          <SelectTrigger>
            <SelectValue placeholder="Type de véhicule" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="STANDARD">Standard</SelectItem>
            <SelectItem value="PREMIUM">Premium</SelectItem>
            <SelectItem value="VAN">Van</SelectItem>
            <SelectItem value="ELECTRIC">Électrique</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

export default VehicleFilters;
