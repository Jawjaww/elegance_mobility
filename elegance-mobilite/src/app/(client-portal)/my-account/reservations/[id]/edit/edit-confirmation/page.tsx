'use client';

import { EditConfirmationDetails } from '@/components/reservation/EditConfirmationDetails';
import { useParams } from 'next/navigation';

export default function Page() {
  // Utiliser useParams hook pour récupérer l'id côté client
  const params = useParams();
  const id = params?.id as string;
  
  if (!id) {
    return (
      <div className="container mx-auto py-8 text-center">
        <h1 className="text-xl font-bold text-red-500">Erreur</h1>
        <p>Identifiant de réservation manquant</p>
      </div>
    );
  }
  
  return <EditConfirmationDetails reservationId={id} />;
}
