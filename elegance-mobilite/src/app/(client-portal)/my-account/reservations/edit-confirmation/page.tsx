"use client";

import { Suspense } from "react";
import { EditConfirmationDetails } from "@/components/reservation/EditConfirmationDetails";
import { useSearchParams, useRouter } from "next/navigation";

function EditConfirmationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const reservationId = searchParams?.get("id") || null;

  if (!reservationId) {
    return (
      <div className="container mx-auto py-8 text-center space-y-4">
        <h1 className="text-xl font-bold text-red-500">Erreur</h1>
        <p>Identifiant de réservation manquant</p>
        <button
          onClick={() => router.push("/my-account/reservations")}
          className="px-4 py-2 bg-primary text-white rounded-md"
        >
          Retour aux réservations
        </button>
      </div>
    );
  }

  return <EditConfirmationDetails reservationId={reservationId} />;
}

export default function EditConfirmationPage() {
  return (
    <Suspense
      fallback={<div className="flex justify-center my-12">Chargement...</div>}
    >
      <EditConfirmationContent />
    </Suspense>
  );
}
