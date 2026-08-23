"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, User } from "lucide-react";
import { DriverListCard } from "@/components/admin/drivers/DriverListCard";
import type { DriverWithVehicle } from "@/lib/drivers/adminDrivers";

const SKELETON_KEYS = ["sk-1", "sk-2", "sk-3"] as const;

type DriverListProps = Readonly<{
  drivers: DriverWithVehicle[];
  loading: boolean;
  hasDrivers: boolean;
  hasFilteredResults: boolean;
}>;

function DriverListSkeleton() {
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

function EmptyDriversState() {
  return (
    <Card className="border-neutral-800 bg-neutral-900/50 p-6 sm:p-8 text-center w-full">
      <User className="w-12 h-12 mx-auto text-neutral-600 mb-4" aria-hidden />
      <h3 className="text-lg font-semibold text-neutral-100 mb-2">
        Aucun chauffeur
      </h3>
      <p className="text-neutral-400 mb-6 text-sm">
        Les chauffeurs s&apos;inscrivent via le portail chauffeur puis
        complètent leur dossier.
      </p>
      <Button variant="outline" asChild className="border-neutral-700">
        <Link href="/backoffice-portal/drivers/pending">
          Voir les dossiers en attente
        </Link>
      </Button>
    </Card>
  );
}

function NoSearchResultsState() {
  return (
    <Card className="border-neutral-800 bg-neutral-900/50 p-6 text-center w-full">
      <AlertCircle className="w-10 h-10 mx-auto text-neutral-600 mb-3" aria-hidden />
      <p className="text-neutral-400 text-sm">
        Aucun chauffeur ne correspond à votre recherche ou au filtre sélectionné.
      </p>
    </Card>
  );
}

export function DriverList({
  drivers,
  loading,
  hasDrivers,
  hasFilteredResults,
}: DriverListProps) {
  if (loading) {
    return <DriverListSkeleton />;
  }

  if (!hasDrivers) {
    return <EmptyDriversState />;
  }

  if (!hasFilteredResults) {
    return <NoSearchResultsState />;
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {drivers.map((driver) => (
        <DriverListCard key={driver.id} driver={driver} />
      ))}
    </div>
  );
}
