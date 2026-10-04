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

interface FleetDriver {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  status: string;
  rating: number | null;
}

/**
 * Les libellés de `driver_status`, y compris les valeurs legacy encore présentes dans l'enum :
 * un chauffeur seedé peut porter `incomplete` ou `pending_validation`, et un écran qui affiche
 * `pending_validation` brut se lit mal.
 */
const DRIVER_STATUS_LABELS: Record<string, string> = {
  draft: "Brouillon",
  pending_review: "En revue",
  active: "Actif",
  rejected: "Refusé",
  suspended: "Suspendu",
  on_vacation: "En vacances",
  inactive: "Inactif",
  incomplete: "Incomplet",
  pending_validation: "En validation",
};

export default function OperatorDriversPage() {
  const [drivers, setDrivers] = useState<FleetDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Aucun filtre sur operator_id : la politique `operators_read_own_fleet` ne renvoie que la
      // flotte de l'appelant. Le filtre serait de toute façon la bonne lecture, mais le poser ici
      // donnerait l'illusion que c'est lui qui protège.
      const { data, error: readError } = await supabase
        .from("drivers")
        .select("id, first_name, last_name, phone, status, rating")
        .order("first_name", { ascending: true });

      if (readError) throw new Error(readError.message);
      setDrivers((data ?? []) as FleetDriver[]);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lecture de la flotte impossible.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PortalSection
      title="Chauffeurs"
      subtitle="Votre flotte. Le dossier et sa validation restent à la plateforme."
    >
      {loading ? (
        <PortalSkeleton />
      ) : error ? (
        <PortalMessage title="Flotte indisponible." detail={error} onRetry={() => void load()} />
      ) : drivers.length === 0 ? (
        <PortalMessage title="Aucun chauffeur rattaché à votre flotte." />
      ) : (
        <Card className="overflow-hidden border-neutral-800 bg-neutral-900/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Chauffeur</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {drivers.map((driver) => (
                <TableRow key={driver.id}>
                  <TableCell className="font-medium text-neutral-100">
                    {driverDisplayName(driver)}
                  </TableCell>
                  <TableCell className="text-neutral-400">{driver.phone ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-neutral-700 text-neutral-300">
                      {DRIVER_STATUS_LABELS[driver.status] ?? driver.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right text-neutral-300">
                    {typeof driver.rating === "number" ? driver.rating.toFixed(1) : "—"}
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
