"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PackageOpen } from "lucide-react";
import { OptionListCard } from "@/components/admin/options/OptionListCard";
import type { OptionRow } from "@/lib/services/optionsAdminService";

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"] as const;

type OptionListProps = Readonly<{
  options: OptionRow[];
  loading: boolean;
  hasOptions: boolean;
  hasFilteredResults: boolean;
  onEdit: (option: OptionRow) => void;
  onDelete: (option: OptionRow) => void;
  onCreate: () => void;
}>;

function OptionListSkeleton() {
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

function EmptyOptionsState({ onCreate }: Readonly<{ onCreate: () => void }>) {
  return (
    <Card className="border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 text-center w-full">
      <PackageOpen className="w-12 h-12 mx-auto text-neutral-600 mb-4" aria-hidden />
      <h3 className="text-lg font-semibold text-neutral-100 mb-2">
        Aucune option
      </h3>
      <p className="text-neutral-400 mb-6 text-sm">
        Ajoutez des services additionnels proposés à la réservation.
      </p>
      <Button onClick={onCreate}>Ajouter une option</Button>
    </Card>
  );
}

function NoSearchResultsState() {
  return (
    <Card className="border-neutral-800 bg-neutral-900/50 p-6 text-center w-full">
      <p className="text-neutral-400 text-sm">
        Aucune option ne correspond à votre recherche.
      </p>
    </Card>
  );
}

export function OptionList({
  options,
  loading,
  hasOptions,
  hasFilteredResults,
  onEdit,
  onDelete,
  onCreate,
}: OptionListProps) {
  if (loading) return <OptionListSkeleton />;
  if (!hasOptions) return <EmptyOptionsState onCreate={onCreate} />;
  if (!hasFilteredResults) return <NoSearchResultsState />;

  return (
    <div className="flex flex-col gap-4 w-full">
      {options.map((option) => (
        <OptionListCard
          key={option.id}
          option={option}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
