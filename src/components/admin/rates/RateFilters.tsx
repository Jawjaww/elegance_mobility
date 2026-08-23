"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type RateFiltersProps = Readonly<{
  search: string;
  onSearchChange: (value: string) => void;
}>;

export function RateFilters({ search, onSearchChange }: RateFiltersProps) {
  return (
    <div className="flex-1 relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
      <Input
        placeholder="Rechercher par type de véhicule…"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-10 bg-neutral-800 border-neutral-700 text-white"
      />
    </div>
  );
}
