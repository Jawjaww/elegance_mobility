"use client";

import { useEffect } from 'react';
import { useReservationStore } from '@/lib/stores/reservationStore';
import { usePrice } from '@/hooks/usePrice';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmationMap } from '@/components/map/ConfirmationMap';

export default function ConfirmationPage() {
  const {
    departure,
    destination,
    distance,
    selectedVehicle,
    selectedOptions,
  } = useReservationStore();

  const {
    base,
    distance: distancePrice,
    options: optionsPrice,
    loading,
    error,
    formattedTotal
  } = usePrice({
    vehicleType: selectedVehicle,
    distanceKm: distance || 0,
    selectedOptions
  });

  // Rediriger si les informations nécessaires ne sont pas disponibles
  useEffect(() => {
    if (!departure || !destination || !selectedVehicle) {
      window.location.href = '/reservation';
    }
  }, [departure, destination, selectedVehicle]);

  if (loading) {
    return (
      <div className="container mx-auto py-10">
        <div className="space-y-4">
          <div className="h-8 bg-neutral-800 rounded w-1/3 animate-pulse"></div>
          <div className="h-4 bg-neutral-800 rounded w-3/4 animate-pulse"></div>
          <div className="h-4 bg-neutral-800 rounded w-1/2 animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4 text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Confirmation de votre trajet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <Card className="p-6 bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
            <h2 className="text-xl font-semibold mb-4">Détails du trajet</h2>
            <div className="space-y-4">
              <div>
                <p className="text-neutral-400">Départ</p>
                <p className="font-medium">{departure?.display_name}</p>
              </div>
              <div>
                <p className="text-neutral-400">Destination</p>
                <p className="font-medium">{destination?.display_name}</p>
              </div>
              <div>
                <p className="text-neutral-400">Distance</p>
                <p className="font-medium">{distance?.toFixed(1) ?? 'N/A'} km</p>
              </div>
              <div>
                <p className="text-neutral-400">Véhicule</p>
                <p className="font-medium capitalize">{selectedVehicle}</p>
              </div>
              {selectedOptions.length > 0 && (
                <div>
                  <p className="text-neutral-400">Options</p>
                  <ul className="list-disc list-inside">
                    {selectedOptions.map(option => (
                      <li key={option} className="font-medium capitalize">
                        {option}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Card>

          <Card className="mt-6 p-6 bg-neutral-900/50 backdrop-blur-lg border-neutral-800">
            <h2 className="text-xl font-semibold mb-4">Détails du prix</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Prix de base</span>
                <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(base)}</span>
              </div>
              <div className="flex justify-between">
                <span>Prix au km ({distance?.toFixed(1) ?? 'N/A'} km)</span>
                <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(distancePrice)}</span>
              </div>
              {optionsPrice > 0 && (
                <div className="flex justify-between">
                  <span>Options</span>
                  <span>{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(optionsPrice)}</span>
                </div>
              )}
              <div className="border-t border-neutral-800 mt-4 pt-4">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total</span>
                  <span>{formattedTotal}</span>
                </div>
              </div>
            </div>
          </Card>

          <div className="mt-8 flex gap-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full"
            >
              Retour
            </Button>
            <Button
              onClick={() => {
                // TODO: Implémenter la confirmation finale
              }}
              className="w-full"
            >
              Confirmer la réservation
            </Button>
          </div>
        </div>

        <div className="h-[600px] rounded-lg overflow-hidden border border-neutral-800">
          <ConfirmationMap
            departure={departure}
            destination={destination}
          />
        </div>
      </div>
    </div>
  );
}