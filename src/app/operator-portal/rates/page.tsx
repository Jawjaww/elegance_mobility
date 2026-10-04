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
import { formatAmount } from "@/lib/operator/display";
import {
  buildOperatorRatesView,
  type OperatorRateRow,
  type OperatorRateView,
} from "@/lib/operator/ratesView";
import { PortalMessage, PortalSection, PortalSkeleton } from "../_components/PortalShell";
import { useOperatorTenant } from "../_components/useOperatorTenant";

export default function OperatorRatesPage() {
  const { tenant, loading: tenantLoading, error: tenantError } = useOperatorTenant();
  const [rates, setRates] = useState<OperatorRateView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenant) return;

    setLoading(true);
    setError(null);

    try {
      // La politique renvoie les défauts plateforme et les surcharges de la flotte. Le tri et la
      // fusion se font dans `buildOperatorRatesView`, qui re-filtre par prudence.
      const { data, error: readError } = await supabase
        .from("rates")
        .select("vehicle_type, base_price, price_per_km, min_price, operator_id");

      if (readError) throw new Error(readError.message);

      setRates(buildOperatorRatesView((data ?? []) as OperatorRateRow[], tenant.operatorId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Lecture des tarifs impossible.");
    } finally {
      setLoading(false);
    }
  }, [tenant]);

  useEffect(() => {
    void load();
  }, [load]);

  const busy = tenantLoading || loading;
  const failure = tenantError ?? error;

  return (
    <PortalSection
      title="Tarifs"
      subtitle="Le tarif plateforme, remplacé par celui de votre flotte quand vous en avez un. La modification se fait au back-office (OP-06)."
    >
      {busy ? (
        <PortalSkeleton />
      ) : failure ? (
        <PortalMessage title="Tarifs indisponibles." detail={failure} onRetry={() => void load()} />
      ) : !tenant ? (
        <PortalMessage title="Compte non rattaché à un opérateur." />
      ) : rates.length === 0 ? (
        <PortalMessage title="Aucun tarif disponible." />
      ) : (
        <Card className="overflow-hidden border-neutral-800 bg-neutral-900/40">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type de véhicule</TableHead>
                <TableHead className="text-right">Prise en charge</TableHead>
                <TableHead className="text-right">Prix / km</TableHead>
                <TableHead className="text-right">Minimum</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.map((rate) => (
                <TableRow key={rate.vehicle_type}>
                  <TableCell className="font-medium text-neutral-100">
                    {rate.vehicle_type}
                  </TableCell>
                  <TableCell className="text-right text-neutral-300">
                    {formatAmount(rate.base_price)}
                  </TableCell>
                  <TableCell className="text-right text-neutral-300">
                    {formatAmount(rate.price_per_km)}
                  </TableCell>
                  <TableCell className="text-right text-neutral-300">
                    {formatAmount(rate.min_price)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        rate.source === "override"
                          ? "border-violet-500/60 text-violet-200"
                          : "border-neutral-700 text-neutral-400"
                      }
                    >
                      {rate.source === "override" ? "Votre flotte" : "Plateforme"}
                    </Badge>
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
