import { EditConfirmationDetails } from "@/components/reservation/EditConfirmationDetails";
import { use } from "react";

// For static export compatibility (Tauri)
export function generateStaticParams() {
  return [{ id: "__placeholder__" }];
}

interface PageProps {
  params: any | Promise<any>;
}

export default async function Page({ params }: PageProps) {
  const { id: reservationId } = (await params) as any;

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
