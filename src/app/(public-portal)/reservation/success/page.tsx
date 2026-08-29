export default function ReservationSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-md text-center">
        <h1 className="text-xl sm:text-2xl font-bold text-green-600 text-balance">
          Réservation confirmée&nbsp;!
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-4">
          Votre réservation a été créée avec succès.
        </p>
      </div>
    </div>
  );
}
