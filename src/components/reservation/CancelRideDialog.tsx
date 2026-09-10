"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  clientCancelRide,
  isClientCancelFailure,
  previewClientCancelQuote,
} from "@/services/clientRideService";
import {
  formatFeeEuro,
  type CancelQuote,
} from "@/lib/rides/rideFeePolicy";
import { cancelReasonCodeLabel } from "@/lib/rides/rideCancelLabels";

type CancelRideDialogProps = Readonly<{
  rideId: string | null;
  open: boolean;
  onClose: () => void;
  onCanceled: () => void;
}>;

function quoteMessage(quote: CancelQuote): string {
  if (!quote.client_may_cancel) {
    return "Cette course ne peut pas être annulée dans son état actuel.";
  }
  if (quote.amount > 0) {
    return `Frais estimés : ${formatFeeEuro(quote.amount)} (affichés seulement, pas de paiement automatique).`;
  }
  return "Aucun frais ne s'applique.";
}

export function CancelRideDialog({
  rideId,
  open,
  onClose,
  onCanceled,
}: CancelRideDialogProps) {
  const [quote, setQuote] = useState<CancelQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !rideId) {
      setQuote(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await previewClientCancelQuote(rideId);
        if (!cancelled) setQuote(next);
      } catch (err) {
        if (!cancelled) {
          setQuote(null);
          setError(
            err instanceof Error ? err.message : "Impossible d'estimer les frais",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [open, rideId]);

  const handleConfirm = async () => {
    if (!rideId || !quote?.client_may_cancel) return;
    setConfirming(true);
    setError(null);
    try {
      const result = await clientCancelRide(rideId);
      if (isClientCancelFailure(result)) {
        throw new Error(result.error || "Impossible d'annuler la réservation");
      }
      onCanceled();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible d'annuler la réservation",
      );
    } finally {
      setConfirming(false);
    }
  };

  const canConfirm = Boolean(quote?.success && quote.client_may_cancel);

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="bg-neutral-950 border-neutral-800 text-neutral-100 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Annuler la course</DialogTitle>
          <DialogDescription className="text-neutral-400">
            Vérifiez les frais affichés avant de confirmer.
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <p className="text-sm text-neutral-500">Calcul du devis…</p>
        ) : null}
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {quote && !loading && quote.success ? (
          <div className="space-y-2 text-sm">
            <p className="text-neutral-200">{quoteMessage(quote)}</p>
            <p className="text-neutral-400">
              Motif : {cancelReasonCodeLabel(quote.reason_code)}
            </p>
          </div>
        ) : null}
        {quote && !quote.success && quote.error ? (
          <p className="text-sm text-red-400">{quote.error}</p>
        ) : null}
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Retour
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={!canConfirm || confirming || loading}
            onClick={() => void handleConfirm()}
          >
            {confirming ? "Annulation…" : "Confirmer l'annulation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
