"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import { RateListCard } from "@/components/admin/rates/RateListCard";
import type { RateRow } from "@/lib/rates/adminRates";
import type { ReactNode } from "react";

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"] as const;

type RateListProps = Readonly<{
  rates: RateRow[];
  loading: boolean;
  hasRates: boolean;
  hasFilteredResults: boolean;
  onDelete: (rate: RateRow) => void;
  onCreate: () => void;
  renderEditTrigger: (rate: RateRow) => ReactNode;
}>;

function RateListSkeleton() {
  return (
    <div className="flex flex-col gap-4 w-full">
      {SKELETON_KEYS.map((key) => (
        <Card
          key={key}
          className="animate-pulse border-neutral-800 bg-neutral-900/50 w-full"
        >
          <div className="p-4 sm:p-6 space-y-3">
            <div className="h-6 bg-neutral-800 rounded w-3/4" />
            <div className="h-4 bg-neutral-800 rounded w-1/2" />
            <div className="h-9 bg-neutral-800 rounded w-full" />
          </div>
        </Card>
      ))}
    </div>
  );
}

function EmptyRatesState({ onCreate }: Readonly<{ onCreate: () => void }>) {
  return (
    <Card className="border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 text-center w-full">
      <Car className="w-12 h-12 mx-auto text-neutral-600 mb-4" aria-hidden />
      <h3 className="text-lg font-semibold text-neutral-100 mb-2">
        Aucun tarif
      </h3>
      <p className="text-neutral-400 mb-6 text-sm">
        Définissez les tarifs de base et kilométriques par type de véhicule.
      </p>
      <Button onClick={onCreate}>Ajouter un tarif</Button>
    </Card>
  );
}

function NoSearchResultsState() {
  return (
    <Card className="border-neutral-800 bg-neutral-900/50 p-6 text-center w-full">
      <p className="text-neutral-400 text-sm">
        Aucun tarif ne correspond à votre recherche.
      </p>
    </Card>
  );
}

export function RateList({
  rates,
  loading,
  hasRates,
  hasFilteredResults,
  onDelete,
  onCreate,
  renderEditTrigger,
}: RateListProps) {
  if (loading) return <RateListSkeleton />;
  if (!hasRates) return <EmptyRatesState onCreate={onCreate} />;
  if (!hasFilteredResults) return <NoSearchResultsState />;

  return (
    <div className="flex flex-col gap-4 w-full">
      {rates.map((rate) => (
        <RateListCard
          key={rate.id}
          rate={rate}
          editTrigger={renderEditTrigger(rate)}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
