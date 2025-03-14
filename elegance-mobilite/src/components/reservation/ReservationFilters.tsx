"use client";

import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StatusBadge } from "./StatusBadge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks";
import { ALL_UI_STATUSES, STATUS_LABELS } from "@/lib/services/statusService";

export interface ReservationFiltersProps {
  onStatusChange: (statuses: string[]) => void;
  selectedStatuses: string[];
}

export function ReservationFilters({ onStatusChange, selectedStatuses = [] }: ReservationFiltersProps) {
  const [open, setOpen] = useState(false);
  const isMobile = useMediaQuery("(max-width: 768px)");

  const handleStatusToggle = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const handleSelectAll = () => {
    onStatusChange(ALL_UI_STATUSES);
  };

  const handleClearAll = () => {
    onStatusChange([]);
  };

  // Version mobile avec Tabs - améliorée avec plus de padding
  if (isMobile) {
    return (
      <div className="mb-8 px-2 mt-4"> {/* Ajout de padding horizontal et vertical */}
        <Tabs defaultValue="all" className="w-full" onValueChange={(value) => {
          if (value === "all") {
            handleSelectAll();
          } else {
            onStatusChange([value]);
          }
        }}>
          <TabsList className="grid grid-cols-5 mb-4 p-1 bg-neutral-800/50"> {/* Amélioré l'espacement et la couleur */}
            <TabsTrigger value="all" className="text-xs py-2">Tous</TabsTrigger>
            <TabsTrigger value="pending" className="text-xs py-2">En attente</TabsTrigger>
            <TabsTrigger value="accepted" className="text-xs py-2">Planifiée</TabsTrigger>
            <TabsTrigger value="completed" className="text-xs py-2">Terminée</TabsTrigger>
            {/* Utiliser "canceled" comme valeur unique pour toutes les annulations */}
            <TabsTrigger value="canceled" className="text-xs py-2">Annulée</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    );
  }

  // Version desktop avec dropdown - améliorée avec plus d'espacement
  return (
    <div className="flex items-center gap-4 mb-8 mt-2 px-1 py-2"> {/* Ajout de padding et marge */}
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-9 px-4 border-neutral-700 bg-neutral-800"> {/* Bouton plus grand */}
            <Filter className="mr-2 h-4 w-4" />
            Filtrer par statut
            {selectedStatuses.length > 0 && (
              <span className="ml-2 rounded-full bg-blue-500 px-2 py-0.5 text-xs"> {/* Badge amélioré */}
                {selectedStatuses.length}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-neutral-900 border-neutral-800 p-2"> {/* Plus de padding interne */}
          <DropdownMenuLabel className="text-sm font-medium py-2">Filtrer par statut</DropdownMenuLabel> {/* Texte amélioré */}
          <DropdownMenuSeparator className="bg-neutral-800 my-2" />
          {ALL_UI_STATUSES.map((status) => (
            <DropdownMenuCheckboxItem
              key={status}
              checked={selectedStatuses.includes(status)}
              onCheckedChange={() => handleStatusToggle(status)}
              className="focus:bg-neutral-800 py-2"
            >
              <div className="flex items-center gap-3"> {/* Plus d'espace entre éléments */}
                <StatusBadge status={status} size="sm" />
              </div>
            </DropdownMenuCheckboxItem>
          ))}
          <DropdownMenuSeparator className="bg-neutral-800 my-2" />
          <div className="flex px-2 py-3 justify-between"> {/* Plus d'espace */}
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-3"
              onClick={handleSelectAll}
            >
              Tout sélectionner
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-8 px-3 text-neutral-400"
              onClick={handleClearAll}
            >
              Tout effacer
            </Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
