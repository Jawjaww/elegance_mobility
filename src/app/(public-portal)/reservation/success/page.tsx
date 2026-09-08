export default function ReservationSuccessPage() {
  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-md text-center">
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.2em] text-blue-400">
          Réservation
        </p>
        <h1 className="text-balance text-2xl font-bold text-white sm:text-3xl">
          Réservation confirmée
        </h1>
        <p className="mt-4 text-sm text-neutral-400 sm:text-base">
          Votre course est enregistrée. Vous recevrez les détails du chauffeur
          avant le départ.
        </p>
      </div>
    </div>
  );
}
