"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/database/client";
import { driverDisplayName } from "@/lib/operator/display";
import { PortalMessage, PortalSection, PortalSkeleton } from "../_components/PortalShell";

interface FleetVehicle {
  id: string;
  make: string | null;
  model: string | null;
  license_plate: string | null;
  vehicle_type: string | null;
  driver_id: string | null;
}

interface FleetDriverName {
  id: string;
  first_name: string | null;
  last_name: string | null;
}

export default function OperatorVehiclesPage() {
  const [vehicles, setVehicles] = useState<FleetVehicle[]>([]);
  const [driverNames, setDriverNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Deux lectures plutôt qu'un embed : les deux tables sont filtrées par la même politique de
      // portée, et une jointure PostgREST ajouterait une dépendance au nom de la contrainte pour
      // un simple affichage.
      const [vehiclesResult, driversResult] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id, make, model, license_plate, vehicle_type, driver_id")
          .order("license_plate", { ascending: true }),
        supabase.from("drivers").select("id, first_name, last_name"),
      ]);

      if (vehiclesResult.error) throw new Error(vehiclesResult.error.message);
      if (driversResult.error) throw new Error(driversResult.error.message);

      const names: Record<string, string> = {};
      for (const driver of (driversResult.data ?? []) as FleetDriverName[]) {
        names[driver.id] = driverDisplayName(driver);
      }

      setDriverNames(names);
      setVehicles((vehiclesResult.data ?? []) as FleetVehicle[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lecture des véhicules impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PortalSection title="Véhicules" subtitle="Les véhicules rattachés à votre flotte.">
      {loading ? (
        <PortalSkeleton />
      ) : error ? (
        <PortalMessage
          title="Véhicules indisponibles."
          detail={error}
          onRetry={() => void load()}
        />
      ) : vehicles.length === 0 ? (
        <PortalMessage title="Aucun véhicule rattaché à votre flotte." />
      ) : (
        <Card className="overflow-hidden border-neutral-800 bg-neutral-900/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Plaque</TableHead>
                <TableHead>Véhicule</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Chauffeur</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles.map((vehicle) => (
                <TableRow key={vehicle.id}>
                  <TableCell className="font-medium text-neutral-100">
                    {vehicle.license_plate ?? "—"}
                  </TableCell>
                  <TableCell className="text-neutral-300">
                    {[vehicle.make, vehicle.model].filter(Boolean).join(" ") || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-neutral-700 text-neutral-300">
                      {vehicle.vehicle_type ?? "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-400">
                    {vehicle.driver_id ? (driverNames[vehicle.driver_id] ?? "—") : "Non affecté"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </PortalSection>
  );
}
