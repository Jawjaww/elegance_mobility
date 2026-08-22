"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable } from "@/components/ui/data-table";
import { useToast } from "@/hooks/useToast";
import { RateForm } from "./RateForm";
import { columns } from "./columns";
import type { Rate } from "@/lib/services/pricingService";
import {
  deleteRateByVehicleType,
  listRates,
  updateRateByVehicleType,
  upsertRate,
} from "@/lib/services/ratesAdminService";

export default function RatesPage() {
  const { toast } = useToast();
  const [rates, setRates] = useState<(Rate & { id: number })[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listRates();
      setRates(data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Impossible de charger les tarifs",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (
    vehicleType: string,
    changes: Partial<Rate>,
  ) => {
    try {
      await updateRateByVehicleType(vehicleType, changes);
      toast({ title: "Tarif mis à jour" });
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Échec de la mise à jour",
      });
      throw err;
    }
  };

  const handleDelete = async (vehicleType: string) => {
    try {
      await deleteRateByVehicleType(vehicleType);
      toast({ title: "Tarif supprimé" });
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Échec de la suppression",
      });
    }
  };

  const handleCreate = async (rate: Rate) => {
    try {
      await upsertRate(rate);
      toast({ title: "Tarif créé" });
      await load();
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description:
          err instanceof Error ? err.message : "Échec de la création",
      });
      throw err;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-100">
            Tarifs kilométriques
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Gérer les tarifs de base et kilométriques par type de véhicule
          </p>
        </div>
        <RateForm mode="create" onSubmit={handleCreate} />
      </div>

      {loading ? (
        <div className="min-h-[160px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <DataTable
          columns={columns({ onSave: handleSave, onDelete: handleDelete })}
          data={rates}
          searchKey="vehicleType"
          searchPlaceholder="Filtrer par type…"
        />
      )}
    </div>
  );
}
