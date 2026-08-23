"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Car, Trash2 } from "lucide-react";
import {
  formatRatePrice,
  vehicleTypeBadgeClass,
  vehicleTypeLabel,
} from "@/lib/rates/adminRates";
import type { RateRow } from "@/lib/rates/adminRates";
import type { ReactNode } from "react";

type RateListCardProps = Readonly<{
  rate: RateRow;
  editTrigger: ReactNode;
  onDelete: (rate: RateRow) => void;
}>;

export function RateListCard({ rate, editTrigger, onDelete }: RateListCardProps) {
  return (
    <Card className="overflow-hidden border-neutral-800 bg-neutral-900 hover:border-neutral-700 transition-all w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
              style={{
                background: "rgba(168, 85, 247, 0.1)",
                border: "1px solid rgba(168, 85, 247, 0.2)",
              }}
            >
              <Car className="h-5 w-5 text-purple-400" aria-hidden />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base sm:text-lg text-white truncate">
                {vehicleTypeLabel(rate.vehicleType)}
              </h3>
              <p className="text-sm text-neutral-400 font-mono">
                {rate.vehicleType}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className={`shrink-0 text-xs ${vehicleTypeBadgeClass(rate.vehicleType)}`}
          >
            Tarif actif
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 px-3 py-2">
            <p className="text-neutral-500 text-xs mb-0.5">Prix de base</p>
            <p className="text-white font-medium">
              {formatRatePrice(rate.basePrice)}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 px-3 py-2">
            <p className="text-neutral-500 text-xs mb-0.5">Prix / km</p>
            <p className="text-white font-medium">
              {formatRatePrice(rate.pricePerKm)}
            </p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-950/50 px-3 py-2">
            <p className="text-neutral-500 text-xs mb-0.5">Prix minimum</p>
            <p className="text-white font-medium">
              {formatRatePrice(rate.minPrice)}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="flex-1 [&>button]:w-full">{editTrigger}</div>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-red-900/50 text-red-400 hover:bg-red-950/50 hover:border-red-800"
            onClick={() => onDelete(rate)}
          >
            <Trash2 className="w-3.5 h-3.5 mr-2" aria-hidden />
            Supprimer
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
