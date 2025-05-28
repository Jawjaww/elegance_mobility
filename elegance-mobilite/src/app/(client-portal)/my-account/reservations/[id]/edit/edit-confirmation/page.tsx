import { EditConfirmationDetails } from '@/components/reservation/EditConfirmationDetails';

export default async function Page({ params }: { params: { id: string } }) {
  // Si tu dois faire un fetch ou autre ici, tu peux utiliser await
  const reservationId = params.id;
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
