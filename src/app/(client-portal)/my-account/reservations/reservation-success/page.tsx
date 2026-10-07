"use client";
import { useEffect } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useReservationStore } from "@/lib/stores/reservationStore";

/**
 * Fills the space left between the header and the bottom nav (`flex-1`) instead of declaring
 * its own `min-h-screen`. A viewport-sized block nested inside the shell added a full screen
 * of height on top of the header and the nav clearance, which is why this page scrolled far
 * more than the others.
 *
 * Cette page est aussi le terminus du tunnel : le brouillon a servi, il est **consommé** ici.
 * Persisté sans être effacé, il faisait démarrer la réservation suivante avec les options de la
 * précédente — 217 courses cloud portaient les deux mêmes options jamais choisies.
 */
export default function ReservationSuccessPage() {
  useEffect(() => {
    useReservationStore.getState().reset();
  }, []);

  return (
    <div className="flex flex-1 items-center justify-center px-5 py-12 sm:px-6">
      <div className="w-full max-w-3xl">
        <div className="flex flex-col items-center mb-12 space-y-4 text-center">
          <div className="inline-flex items-center justify-center bg-blue-600/20 rounded-full p-4 sm:p-6 animate-in zoom-in-50 duration-500">
            <Check className="h-12 w-12 sm:h-16 sm:w-16 text-blue-500" />
          </div>
          <h1 className="w-full px-1 text-xl sm:text-2xl md:text-3xl font-bold text-neutral-100 text-balance animate-in fade-in slide-in-from-bottom-2 duration-700 delay-150">
            Réservation confirmée&nbsp;!
          </h1>
          <p className="text-sm sm:text-base text-neutral-400 max-w-lg mx-auto animate-in fade-in slide-in-from-bottom-2 duration-700 delay-300">
            Votre réservation a bien été enregistrée.
            <br />
            Vous pouvez la retrouver, la modifier ou l&apos;annuler à tout moment
            dans{" "}
            <Link
              href="/my-account/reservations"
              className="text-blue-400 hover:text-blue-300"
            >
              Mes réservations
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
