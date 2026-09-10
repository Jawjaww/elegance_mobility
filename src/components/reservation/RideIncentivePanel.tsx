"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import {
  addRideIncentive,
  isAddIncentiveFailure,
} from "@/services/rideIncentiveService";
import {
  confirmRideMatching,
  isConfirmMatchingFailure,
} from "@/services/confirmRideMatchingService";

const QUICK_AMOUNTS = [2, 5, 10] as const;

type RideIncentivePanelProps = Readonly<{
  rideId: string;
  status: string;
  clientIncentive: number;
  matchingPausedAt?: string | null;
  matchingDeadlineAt?: string | null;
  onUpdated?: () => void;
  onCancel?: () => void;
}>;

function toastErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erreur réseau";
}

function MatchingIntro({
  needsConfirm,
  deadlinePassed,
  busy,
  onConfirm,
  onCancel,
}: Readonly<{
  needsConfirm: boolean;
  deadlinePassed: boolean;
  busy: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}>): ReactNode {
  if (needsConfirm) {
    return (
      <>
        <p className="text-sm text-amber-100/90">
          Toujours besoin d&apos;un chauffeur ? Confirmez pour relancer la
          recherche, ajoutez un bonus, ou annulez si vous avez trouvé une
          autre solution.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            disabled={busy}
            className="bg-amber-500/90 text-neutral-950 hover:bg-amber-400"
            onClick={onConfirm}
          >
            Continuer la recherche
          </Button>
          {onCancel ? (
            <Button
              type="button"
              size="sm"
              disabled={busy}
              variant="outline"
              className="border-red-500/40 text-red-300"
              onClick={onCancel}
            >
              Annuler
            </Button>
          ) : null}
        </div>
      </>
    );
  }
  if (deadlinePassed) {
    return (
      <p className="text-sm text-amber-100/90">
        Fenêtre de matching expirée — ajoutez un bonus uniquement si la course
        est encore ouverte, sinon recréez une réservation.
      </p>
    );
  }
  return (
    <p className="text-sm text-neutral-300">
      Attente longue ? Ajoutez un bonus d&apos;intéressement visible par les
      chauffeurs (prolonge la recherche de 20 min).
    </p>
  );
}

export function RideIncentivePanel({
  rideId,
  status,
  clientIncentive,
  matchingPausedAt,
  matchingDeadlineAt,
  onUpdated,
  onCancel,
}: RideIncentivePanelProps) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const canBonus = status === "pending" || status === "delayed";
  if (!canBonus) return null;

  const needsConfirm = matchingPausedAt != null;
  const deadlinePassed =
    matchingDeadlineAt != null &&
    new Date(matchingDeadlineAt).getTime() <= Date.now();

  const onConfirm = async () => {
    setBusy(true);
    try {
      const result = await confirmRideMatching(rideId);
      if (isConfirmMatchingFailure(result)) {
        toast({
          title: "Confirmation impossible",
          description: result.error || "Réessayez plus tard",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Recherche relancée",
        description: "Nous cherchons à nouveau un chauffeur pendant 20 min.",
        variant: "success",
      });
      onUpdated?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: toastErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

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
        description: `+${amount}€ — recherche prolongée de 20 min`,
        variant: "success",
      });
      onUpdated?.();
    } catch (error) {
      toast({
        title: "Erreur",
        description: toastErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-3 space-y-2">
      <MatchingIntro
        needsConfirm={needsConfirm}
        deadlinePassed={deadlinePassed}
        busy={busy}
        onConfirm={() => void onConfirm()}
        onCancel={onCancel}
      />
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
