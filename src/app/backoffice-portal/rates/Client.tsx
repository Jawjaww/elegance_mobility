"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { RateFilters } from "@/components/admin/rates/RateFilters";
import { RateList } from "@/components/admin/rates/RateList";
import { filterRates, type RateRow } from "@/lib/rates/adminRates";
import { RateForm } from "./RateForm";
import type { Rate } from "@/lib/services/pricingService";
import {
  deleteRateByVehicleType,
  listRates,
  updateRateByVehicleType,
  upsertRate,
} from "@/lib/services/ratesAdminService";

export default function RatesPage() {
  const { toast } = useToast();
  const [rates, setRates] = useState<RateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
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
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = () => {
    setRefreshing(true);
    void load();
  };

  const filteredRates = useMemo(
    () => filterRates(rates, search),
    [rates, search],
  );

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

  const handleDelete = async (rate: RateRow) => {
    if (
      !globalThis.confirm(
        `Supprimer le tarif pour ${rate.vehicleType} ?`,
      )
    ) {
      return;
    }
    try {
      await deleteRateByVehicleType(rate.vehicleType);
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
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-100">
            Tarifs kilométriques
          </h2>
          <p className="text-neutral-400 text-sm mt-1">
            Gérer les tarifs de base et kilométriques par type de véhicule
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
              aria-hidden
            />
            Actualiser
          </Button>
          <RateForm
            mode="create"
            onSubmit={handleCreate}
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        </div>
      </div>

      <RateFilters search={search} onSearchChange={setSearch} />

      <RateList
        rates={filteredRates}
        loading={loading}
        hasRates={rates.length > 0}
        hasFilteredResults={filteredRates.length > 0}
        onDelete={handleDelete}
        onCreate={() => setCreateOpen(true)}
        renderEditTrigger={(rate) => (
          <RateForm
            mode="edit"
            initialData={rate}
            onSubmit={async (updatedRate) => {
              await handleSave(rate.vehicleType, {
                pricePerKm: updatedRate.pricePerKm,
                basePrice: updatedRate.basePrice,
                minPrice: updatedRate.minPrice,
              });
            }}
          />
        )}
      />
    </div>
  );
}
