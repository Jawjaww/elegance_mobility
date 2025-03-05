"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { formatDate, formatDuration } from "@/lib/utils/dateUtils";
import { useRouter } from "next/navigation";
import { PriceSummary } from "@/components/reservation/PriceSummary";
import { Check, ChevronLeft } from "lucide-react";

export default function ConfirmationPage() {
  const store = useReservationStore();
  const router = useRouter();

  const handleBack = () => {
    router.push("/reservation");
  };

  const handleConfirm = () => {
    console.log("Réservation confirmée:", {
      departure: store.departure?.display_name,
      destination: store.destination?.display_name,
      dateTime: formatDate(store.pickupDateTime),
      vehicle: store.selectedVehicle,
      options: store.selectedOptions
    });
    
    // Ici, vous appelleriez une API pour sauvegarder la réservation
    // puis navigueriez vers une page de succès
    router.push("/reservation/success");
  };

  // Fonction d'aide pour afficher le type de véhicule
  const getVehicleName = (type: string) => {
    switch (type) {
      case 'STANDARD': return 'Berline Standard';
      case 'PREMIUM': return 'Berline Premium';
      case 'VAN': return 'Van de Luxe';
      case 'berlineStandard': return 'Berline Standard';
      case 'berlinePremium': return 'Berline Premium';
      case 'van': return 'Van';
      default: return type;
    }
  };

  // Fonction d'aide pour afficher les options
  const getOptionName = (option: string) => {
    switch (option) {
      case 'childSeat': return 'Siège enfant';
      case 'pets': return 'Animaux domestiques';
      case 'accueil': return 'Accueil personnalisé';
      case 'boissons': return 'Boissons fraîches';
      default: return option;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-bold mb-8 text-center">
          Confirmation de votre trajet
        </h1>

        <div className="grid gap-8">
          <Card className="bg-neutral-900 border-neutral-800 text-white p-6">
            <h2 className="text-xl font-semibold mb-6">Détails du trajet</h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-neutral-400">Départ</p>
                <p className="text-lg mt-1">{store.departure?.display_name || "Non spécifié"}</p>
              </div>
              
              <div>
                <p className="text-neutral-400">Destination</p>
                <p className="text-lg mt-1">{store.destination?.display_name || "Non spécifiée"}</p>
              </div>
              
              <div>
                <p className="text-neutral-400">Date et heure de prise en charge</p>
                <p className="text-lg mt-1">{formatDate(store.pickupDateTime)}</p>
              </div>
              
              {store.distance && (
                <div className="flex flex-row gap-8">
                  <div>
                    <p className="text-neutral-400">Distance</p>
                    <p className="text-lg mt-1">{store.distance.toFixed(1)} km</p>
                  </div>
                  
                  {store.duration && (
                    <div>
                      <p className="text-neutral-400">Durée estimée</p>
                      <p className="text-lg mt-1">{formatDuration(store.duration)}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div>
                <p className="text-neutral-400">Véhicule</p>
                <p className="text-lg mt-1">{getVehicleName(store.selectedVehicle)}</p>
              </div>
              
              {store.selectedOptions?.length > 0 && (
                <div>
                  <p className="text-neutral-400">Options</p>
                  <ul className="mt-2 space-y-1">
                    {store.selectedOptions.map((option) => (
                      <li key={option} className="flex items-center gap-2">
                        <Check size={16} className="text-green-500" />
                        {getOptionName(option)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="bg-neutral-900 border-neutral-800 text-white p-6">
            <PriceSummary />
          </Card>
          
          <div className="flex gap-4 mt-4">
            <Button 
              variant="outline" 
              className="flex-1 text-white border-neutral-700 bg-neutral-800 hover:bg-neutral-700" 
              onClick={handleBack}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600"
              onClick={handleConfirm}
            >
              Confirmer la réservation
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}