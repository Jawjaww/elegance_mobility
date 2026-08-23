"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, PackageOpen, Trash2 } from "lucide-react";
import { formatOptionPrice } from "@/lib/options/adminOptions";
import type { OptionRow } from "@/lib/services/optionsAdminService";

type OptionListCardProps = Readonly<{
  option: OptionRow;
  onEdit: (option: OptionRow) => void;
  onDelete: (option: OptionRow) => void;
}>;

export function OptionListCard({
  option,
  onEdit,
  onDelete,
}: OptionListCardProps) {
  return (
    <Card className="overflow-hidden border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition-all w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "rgba(59, 130, 246, 0.1)",
                border: "1px solid rgba(59, 130, 246, 0.2)",
              }}
            >
              <PackageOpen className="h-5 w-5 text-blue-400" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base sm:text-lg text-white truncate">
                {option.name}
              </h3>
              <p className="text-sm font-medium text-emerald-400">
                {formatOptionPrice(Number(option.price ?? 0))}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={
              option.available
                ? "shrink-0 text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                : "shrink-0 text-xs bg-neutral-500/10 text-neutral-400 border-neutral-500/30"
            }
          >
            {option.available ? "Disponible" : "Indisponible"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        {option.description ? (
          <p className="text-sm text-neutral-300 line-clamp-2">
            {option.description}
          </p>
        ) : (
          <p className="text-sm text-neutral-500 italic">Sans description</p>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-neutral-700 hover:bg-neutral-800"
            onClick={() => onEdit(option)}
          >
            <Edit className="w-3.5 h-3.5 mr-2" aria-hidden />
            Modifier
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-red-900/50 text-red-400 hover:bg-red-950/50 hover:border-red-800"
            onClick={() => onDelete(option)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" aria-hidden />
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
