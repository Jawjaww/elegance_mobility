"use client";

import { useReservationStore } from "@/lib/stores/reservationStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DynamicLeafletMap from "@/components/map/DynamicLeafletMap";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Suspense } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useRouter } from "next/navigation";

export function ConfirmationDetails() {
  const router = useRouter();
  const {
    departure,
    destination,
    pickupDateTime,
    selectedVehicle,
    selectedOptions,
    reset
  } = useReservationStore();

  const origin = departure ? {
    lat: departure.lat,
    lng: departure.lon
  } : null;

  const destinationCoords = destination ? {
    lat: destination.lat,
    lng: destination.lon
  } : null;

  const handleConfirm = () => {
    // TODO: Envoyer les données à l'API
    // Une fois la réservation enregistrée, on peut nettoyer le store
    reset();
    router.push("/reservation/success");
  };

  const handleModify = () => {
    router.push("/reservation");
  };

  // Redirection si pas de données
  if (!departure || !destination || !pickupDateTime || !selectedVehicle) {
    router.push("/reservation");
    return null;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 max-w-4xl mx-auto">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-6">Résumé de votre réservation</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium">Point de départ</h3>
              <p>{departure.display_name}</p>
            </div>

            <div>
              <h3 className="font-medium">Destination</h3>
              <p>{destination.display_name}</p>
            </div>

            <div>
              <h3 className="font-medium">Date et heure de prise en charge</h3>
              <p>{format(pickupDateTime, "EEEE d MMMM 'à' HH:mm", { locale: fr })}</p>
            </div>

            <div>
              <h3 className="font-medium">Véhicule</h3>
              <p>{selectedVehicle === "STANDARD" ? "Berline Premium" : "Van de Luxe"}</p>
            </div>

            {selectedOptions.length > 0 && (
              <div>
                <h3 className="font-medium">Options sélectionnées</h3>
                <ul className="list-disc list-inside">
                  {selectedOptions.map((option) => (
                    <li key={option}>
                      {option === "accueil" ? "Accueil personnalisé" : "Boissons fraîches"}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>

        <Suspense fallback={<Card className="p-6"><LoadingSpinner /></Card>}>
          <Card className="p-0 overflow-hidden">
            <DynamicLeafletMap
              origin={origin}
              destination={destinationCoords}
              enableRouting={true}
              isInteractive={false}
            />
          </Card>
        </Suspense>

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleModify}
            className="flex-1"
          >
            Modifier
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1"
          >
            Confirmer la réservation
          </Button>
        </div>
      </div>
    </div>
  );
}