"use client";

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
import { driverStatusLabels } from "@/components/admin/drivers/driverStatusStyles";
import type { DriverStatusFilter } from "@/lib/drivers/adminDrivers";

type DriverStatus = Database["public"]["Enums"]["driver_status"];

const STATUS_OPTIONS: DriverStatus[] = [
  "active",
  "pending_review",
  "draft",
  "rejected",
  "pending_validation",
  "incomplete",
  "inactive",
  "suspended",
  "on_vacation",
];

type DriverFiltersProps = Readonly<{
  search: string;
  status: DriverStatusFilter;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: DriverStatusFilter) => void;
}>;

export function DriverFilters({
  search,
  status,
  onSearchChange,
  onStatusChange,
}: DriverFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Rechercher par nom, téléphone, permis ou véhicule..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 bg-neutral-800 border-neutral-700 text-white"
        />
      </div>

      <div className="w-full sm:w-52">
        <Select
          value={status}
          onValueChange={(value) => onStatusChange(value as DriverStatusFilter)}
        >
          <SelectTrigger className="bg-neutral-800 border-neutral-700 text-white">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {driverStatusLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
