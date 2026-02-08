import { EditConfirmationDetails } from "@/components/reservation/EditConfirmationDetails";
import { use } from "react";

// For static export compatibility (Tauri)
export function generateStaticParams() {
  return [{ id: "__placeholder__" }];
}

export const dynamicParams = true;

interface PageProps {
  params: { id: string };
}

export default async function Page({ params }: PageProps) {
  const { id: reservationId } = params;

  if (!reservationId) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-xl font-bold text-red-500">Erreur</h1>
        <p>Identifiant de réservation manquant</p>
      </div>
    );
  }
  return <EditConfirmationDetails reservationId={reservationId} />;
}
