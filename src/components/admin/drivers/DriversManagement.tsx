"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Clock, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { debugRlsProblem } from "@/lib/database/client";
import { DriverFilters } from "@/components/admin/drivers/DriverFilters";
import { DriverList } from "@/components/admin/drivers/DriverList";
import {
  fetchDriversWithVehicles,
  filterDrivers,
  type DriverStatusFilter,
  type DriverWithVehicle,
} from "@/lib/drivers/adminDrivers";

function loadErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

async function logRlsDiagnostic(): Promise<void> {
  try {
    const diag = await debugRlsProblem();
    console.debug("[RLS DIAG] result:", diag);
  } catch (diagError) {
    console.warn("[RLS DIAG] échec du diagnostic:", diagError);
  }
}

export function DriversManagement() {
  const { toast } = useToast();
  const [drivers, setDrivers] = useState<DriverWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<DriverStatusFilter>("all");

  const loadDrivers = useCallback(async () => {
    try {
      const data = await fetchDriversWithVehicles();
      setDrivers(data);
    } catch (error) {
      const message = loadErrorMessage(error);
      console.error("Erreur lors du chargement des chauffeurs:", error);
      await logRlsDiagnostic();

      toast({
        title: "Erreur",
        description: `Impossible de charger les chauffeurs : ${message}`,
        variant: "destructive",
      });

      if (message.includes("JWSInvalidSignature")) {
        toast({
          title: "Session invalide",
          description:
            "Le jeton d'authentification semble invalide — déconnectez-vous puis reconnectez-vous.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadDrivers();
  }, [loadDrivers]);

  const handleRefresh = () => {
    setRefreshing(true);
    void loadDrivers();
  };

  const filteredDrivers = useMemo(
    () => filterDrivers(drivers, searchTerm, statusFilter),
    [drivers, searchTerm, statusFilter],
  );

  const pendingCount = useMemo(
    () =>
      drivers.filter((driver) =>
        ["pending_review", "pending_validation", "draft", "incomplete"].includes(
          driver.status,
        ),
      ).length,
    [drivers],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-neutral-100">Chauffeurs</h2>
          <p className="text-neutral-400 text-sm mt-1">
            Gérez les chauffeurs de votre flotte
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
          <Button variant="outline" size="sm" asChild className="border-neutral-700">
            <Link href="/backoffice-portal/drivers/pending">
              <Clock className="h-4 w-4 mr-2" aria-hidden />
              En attente
              {pendingCount > 0 ? ` (${pendingCount})` : ""}
            </Link>
          </Button>
        </div>
      </div>

      <DriverFilters
        search={searchTerm}
        status={statusFilter}
        onSearchChange={setSearchTerm}
        onStatusChange={setStatusFilter}
      />

      <DriverList
        drivers={filteredDrivers}
        loading={loading}
        hasDrivers={drivers.length > 0}
        hasFilteredResults={filteredDrivers.length > 0}
      />
    </div>
  );
}
