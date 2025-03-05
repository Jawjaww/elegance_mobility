"use client";

import { Card } from "@/components/ui/card";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import DynamicLeafletMap from "@/components/map/DynamicLeafletMap";
import { AutocompleteInput } from "../AutocompleteInput";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Suspense } from "react";
import { useRouter } from "next/navigation";

export function ReservationForm() {
  const router = useRouter();
  const store = useReservationStore();

  const origin = store.departure ? {
    lat: store.departure.lat,
    lng: store.departure.lon
  } : null;

  const destinationCoords = store.destination ? {
    lat: store.destination.lat,
    lng: store.destination.lon
  } : null;

  const handleNextStep = () => {
    try {
      console.log("Navigation vers la page de confirmation...");
      router.push("/reservation/confirmation");
    } catch (error) {
      console.error("Erreur de navigation:", error);
      // Fallback en cas d'échec du router
      window.location.href = "/reservation/confirmation";
    }
  };

  const handleReset = () => {
    store.reset();
  };

  // Fonction de gestion du changement de date pour éviter les problèmes de type
  const handleDateChange = (date: Date | null) => {
    if (date) {
      store.setPickupDateTime(date);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 max-w-4xl mx-auto">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Détails du trajet</h2>
          
          <div className="space-y-6">
            <div>
              <Label>Point de départ</Label>
              <AutocompleteInput
                id="pickup-location"
                value={store.departure?.display_name || ""}
                onSelect={store.setDeparture}
                placeholder="Adresse de départ"
              />
            </div>

            <div>
              <Label>Destination</Label>
              <AutocompleteInput
                id="dropoff-location"
                value={store.destination?.display_name || ""}
                onSelect={store.setDestination}
                placeholder="Adresse d'arrivée"
              />
            </div>

            <div className="mt-4">
              <Label htmlFor="pickup-datetime">Date et heure de prise en charge</Label>
              <div className="mt-2">
                <DateTimePicker 
                  value={store.pickupDateTime || new Date()}
                  onChange={handleDateChange}
                  label="Date et heure de prise en charge"
                  minDate={new Date()}
                />
              </div>
            </div>

            <div className="mt-6">
              <Label className="mb-4 block">Type de véhicule</Label>
              <RadioGroup 
                value={store.selectedVehicle || ""}
                onValueChange={(value) => store.setSelectedVehicle(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="STANDARD" id="standard" />
                  <Label htmlFor="standard">Berline Premium</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="VAN" id="van" />
                  <Label htmlFor="van">Van de Luxe</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="mb-4 block">Options</Label>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="accueil"
                    checked={store.selectedOptions.includes("accueil")}
                    onCheckedChange={(checked) => {
                      store.toggleOption("accueil");
                    }}
                  />
                  <Label htmlFor="accueil">Accueil personnalisé</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="boissons"
                    checked={store.selectedOptions.includes("boissons")}
                    onCheckedChange={(checked) => {
                      store.toggleOption("boissons");
                    }}
                  />
                  <Label htmlFor="boissons">Boissons fraîches</Label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {(origin || destinationCoords) && (
          <Suspense fallback={<Card className="p-6"><LoadingSpinner /></Card>}>
            <Card className="p-0 overflow-hidden">
              <DynamicLeafletMap
                origin={origin}
                destination={destinationCoords}
                enableRouting={!!(origin && destinationCoords)}
                onRouteCalculated={(distance) => store.setDistance(distance)}
              />
            </Card>
          </Suspense>
        )}

        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleNextStep}
            className="flex-1"
            disabled={!origin || !destinationCoords || !store.pickupDateTime || !store.selectedVehicle}
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
}