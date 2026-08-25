"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import {
  addRideIncentive,
  isAddIncentiveFailure,
} from "@/services/rideIncentiveService";

const QUICK_AMOUNTS = [2, 5, 10] as const;

type RideIncentivePanelProps = Readonly<{
  rideId: string;
  status: string;
  clientIncentive: number;
  matchingPausedAt?: string | null;
  matchingDeadlineAt?: string | null;
  onUpdated?: () => void;
}>;

export function RideIncentivePanel({
  rideId,
  status,
  clientIncentive,
  matchingPausedAt,
  matchingDeadlineAt,
  onUpdated,
}: RideIncentivePanelProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const canBonus = status === "pending" || status === "delayed";
  if (!canBonus) return null;

  const deadlinePassed =
    matchingPausedAt != null ||
    (matchingDeadlineAt != null &&
      new Date(matchingDeadlineAt).getTime() <= Date.now());

  const onAdd = async (amount: number) => {
    setBusy(true);
    try {
      const result = await addRideIncentive(rideId, amount);
      if (isAddIncentiveFailure(result)) {
        toast({
          title: "Bonus impossible",
          description: result.error || "Réessayez plus tard",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Bonus ajouté",
        description: `+${amount}€ — recherche prolongée de 2h`,
        variant: "success",
      });
      onUpdated?.();
    } catch (e) {
      toast({
        title: "Erreur",
        description: e instanceof Error ? e.message : "Erreur réseau",
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 space-y-2">
      {deadlinePassed ? (
        <p className="text-sm text-amber-100/90">
          Aucun chauffeur pour le moment — ajoutez un bonus pour prolonger la
          recherche, ou annulez pour recréer une course.
        </p>
      ) : (
        <p className="text-sm text-neutral-300">
          Attente longue ? Ajoutez un bonus d&apos;intéressement visible par les
          chauffeurs.
        </p>
      )}
      {clientIncentive > 0 ? (
        <p className="text-xs text-amber-200/80">
          Bonus actuel : {clientIncentive.toFixed(2)}€
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            type="button"
            size="sm"
            disabled={busy}
            variant="outline"
            className="border-amber-500/40 bg-amber-500/10 text-amber-100 hover:bg-amber-500/20"
            onClick={() => void onAdd(amount)}
          >
            +{amount}€
          </Button>
        ))}
      </div>
    </div>
  );
}
