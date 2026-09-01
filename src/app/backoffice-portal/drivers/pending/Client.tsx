"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useDriverValidation } from "@/hooks/useDriverSignup";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/database/client";
import {
  driverDisplayName,
  driverDossierPath,
  fetchPendingReviewDrivers,
  type DriverWithVehicle,
} from "@/lib/drivers/adminDrivers";
import { useToast } from "@/hooks/useToast";

function loadErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message: unknown }).message;
    if (typeof message === "string" && message.trim()) return message;
  }
  if (error instanceof Error) return error.message;
  return "Erreur inconnue";
}

export default function PendingDriversPage() {
  const { validateDriver, isLoading: isValidating } = useDriverValidation();
  const { toast } = useToast();
  const [pendingDrivers, setPendingDrivers] = useState<DriverWithVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<DriverWithVehicle | null>(
    null,
  );
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const loadPendingDrivers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchPendingReviewDrivers();
      setPendingDrivers(data);
    } catch (error) {
      const message = loadErrorMessage(error);
      console.error("Erreur lors du chargement des chauffeurs:", message, error);
      toast({
        title: "Erreur",
        description: `Impossible de charger les chauffeurs : ${message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPendingDrivers();

    const subscription = supabase
      .channel("pending-drivers")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "drivers",
          filter: "status=eq.pending_review",
        },
        () => {
          void loadPendingDrivers();
        },
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [loadPendingDrivers]);

  const handleReject = (driver: DriverWithVehicle) => {
    setSelectedDriver(driver);
    setShowRejectDialog(true);
  };

  const confirmReject = async () => {
    if (!selectedDriver) return;

    const result = await validateDriver(
      selectedDriver.id,
      false,
      rejectionReason,
    );
    if (result.success) {
      setShowRejectDialog(false);
      setRejectionReason("");
      setSelectedDriver(null);
      await loadPendingDrivers();
    }
  };

  if (loading) {
    return (
      <div className="min-h-[200px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-neutral-100">
          Chauffeurs en attente
        </h2>
        <p className="text-neutral-400 text-sm mt-1">
          Ouvrez chaque dossier pour vérifier les informations, approuver les
          documents un par un, puis activer le chauffeur depuis la fiche dossier.
        </p>
      </div>

      {pendingDrivers.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-neutral-400">
              Aucun chauffeur en attente de validation
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingDrivers.map((driver) => (
            <Card key={driver.id} className="bg-neutral-900 border-neutral-800">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold">
                    {driverDisplayName(driver)}
                  </h2>
                  <p className="text-sm text-neutral-400">
                    {driver.phone ?? "Téléphone non renseigné"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    asChild
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    <Link href={driverDossierPath(driver.id)}>
                      <ClipboardCheck className="h-4 w-4 mr-2" aria-hidden />
                      Réviser le dossier
                    </Link>
                  </Button>
                  <Button
                    onClick={() => handleReject(driver)}
                    disabled={isValidating}
                    variant="destructive"
                  >
                    Refuser
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-neutral-400">Carte VTC</p>
                    <p>{driver.vtc_card_number ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400">Permis</p>
                    <p>{driver.driving_license_number ?? "—"}</p>
                  </div>
                  <div>
                    <p className="text-neutral-400">Expiration carte VTC</p>
                    <p>
                      {driver.vtc_card_expiry_date
                        ? new Date(
                            driver.vtc_card_expiry_date,
                          ).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-neutral-400">Date d&apos;inscription</p>
                    <p>{new Date(driver.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Motif du rejet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Raison du rejet</Label>
              <Input
                id="reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez la raison du rejet"
                className="bg-neutral-800 border-neutral-700"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowRejectDialog(false)}>
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={confirmReject}
              disabled={!rejectionReason.trim() || isValidating}
            >
              Confirmer le rejet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
