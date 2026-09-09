"use client";

import { Suspense } from "react";
import { EditConfirmationDetails } from "@/components/reservation/EditConfirmationDetails";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LandingDesktopPanel } from "@/components/landing/LandingDesktopPanel";
import { LANDING_PAGE_FLOW } from "@/components/landing/landingSurface";

function EditConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams?.get("id") || null;

  if (!reservationId) {
    return (
      <section className={`relative ${LANDING_PAGE_FLOW}`}>
        <div className="relative z-10 mx-auto w-full max-w-2xl">
          <LandingDesktopPanel>
            <div className="space-y-4 text-center">
              <h1 className="text-xl font-bold text-red-500">Erreur</h1>
              <p>Identifiant de réservation manquant</p>
              <Button
                onClick={() => router.push("/my-account/reservations")}
              >
                Retour aux réservations
              </Button>
            </div>
          </LandingDesktopPanel>
        </div>
      </section>
    );
  }

  return (
    <section className={`relative ${LANDING_PAGE_FLOW}`}>
      <div className="relative z-10 mx-auto w-full max-w-4xl lg:max-w-6xl">
        <LandingDesktopPanel>
          <EditConfirmationDetails reservationId={reservationId} />
        </LandingDesktopPanel>
      </div>
    </section>
  );
}

export default function EditConfirmationPage() {
  return (
    <Suspense
      fallback={<div className="my-12 flex justify-center">Chargement...</div>}
    >
      <EditConfirmationContent />
    </Suspense>
  );
}
