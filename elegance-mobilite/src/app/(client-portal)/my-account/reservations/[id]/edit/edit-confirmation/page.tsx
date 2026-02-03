import { EditConfirmationDetails } from '@/components/reservation/EditConfirmationDetails';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Page({ params }: PageProps) {
  const { id: reservationId } = await params;
  
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
