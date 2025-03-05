"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { LoadingSpinner } from "../ui/loading-spinner";
import { formatDate } from "@/lib/utils/dateUtils";
import { pricingService } from "@/lib/services/pricingService";

export function ReservationSummary() {
  const store = useReservationStore();
  const [isLoading, setIsLoading] = useState(true);
  const [price, setPrice] = useState({
    basePrice: 0,
    optionsPrice: 0,
    totalPrice: 0
  });

  useEffect(() => {
    const calculatePrice = async () => {
      if (!store.distance || !store.selectedVehicle) {
        setIsLoading(false);
        return;
      }

      try {
        // Vérifier que le service existe avant d'appeler ses méthodes
        if (pricingService && typeof pricingService.calculatePrice === 'function') {
          const priceData = await pricingService.calculatePrice(
            store.distance,
            store.selectedVehicle,
            store.selectedOptions
          );
          setPrice(priceData);
        } else {
          console.error("Le service de tarification n'est pas correctement initialisé");
          // Définir des valeurs par défaut
          setPrice({
            basePrice: store.distance * 2.5,
            optionsPrice: store.selectedOptions.length * 10,
            totalPrice: (store.distance * 2.5) + (store.selectedOptions.length * 10)
          });
        }
      } catch (error) {
        console.error("Erreur lors du calcul du prix:", error);
      } finally {
        setIsLoading(false);
      }
    };

    calculatePrice();
  }, [store.distance, store.selectedVehicle, store.selectedOptions]);

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center items-center h-40">
          <LoadingSpinner size="lg" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Résumé de votre réservation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1">
          <p className="font-medium">Trajet</p>
          <p className="text-sm text-muted-foreground">
            {store.departure?.display_name} → {store.destination?.display_name}
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-medium">Date et heure</p>
          <p className="text-sm text-muted-foreground">
            {formatDate(store.pickupDateTime)}
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-medium">Véhicule</p>
          <p className="text-sm text-muted-foreground">
            {store.selectedVehicle === 'STANDARD' ? 'Berline Premium' : 
             store.selectedVehicle === 'VAN' ? 'Van de Luxe' : 
             store.selectedVehicle === 'berlineStandard' ? 'Berline Standard' :
             store.selectedVehicle === 'berlinePremium' ? 'Berline Premium' :
             store.selectedVehicle === 'van' ? 'Van de Luxe' : 
             'Non sélectionné'}
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-medium">Options</p>
          {store.selectedOptions.length > 0 ? (
            <ul className="text-sm text-muted-foreground">
              {store.selectedOptions.map(option => (
                <li key={option}>
                  {option === 'accueil' ? 'Accueil personnalisé' :
                   option === 'boissons' ? 'Boissons fraîches' :
                   option === 'childSeat' ? 'Siège enfant' :
                   option === 'pets' ? 'Animaux acceptés' : option}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Aucune option sélectionnée</p>
          )}
        </div>

        <div className="pt-4 border-t">
          <div className="flex justify-between">
            <p className="font-medium">Tarif de base</p>
            <p>{price.basePrice.toFixed(2)} €</p>
          </div>
          {price.optionsPrice > 0 && (
            <div className="flex justify-between">
              <p className="font-medium">Options</p>
              <p>{price.optionsPrice.toFixed(2)} €</p>
            </div>
          )}
          <div className="flex justify-between mt-2 text-lg font-bold">
            <p>Total</p>
            <p>{price.totalPrice.toFixed(2)} €</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
