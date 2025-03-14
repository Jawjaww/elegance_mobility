"use client";

import { Card } from "@/components/ui/card";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import MapLibreMap from "@/components/map/MapLibreMap"; 
import { AutocompleteInput } from "../AutocompleteInput";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import React from "react";
// Importer correctement les types depuis le bon chemin
import { MapMarker, Location } from '@/lib/types/map-types';


// Ajout d'une interface pour les props du composant
export interface ReservationFormProps {
  editMode?: boolean;
  reservationId?: string | null;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({ 
  editMode = false,
  reservationId
}) => {
  const router = useRouter();
  const store = useReservationStore();
  const [mapReady, setMapReady] = useState(false);
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  const renderedRef = useRef(false);
  // Ajouter l'état des marqueurs qui manquait
  const [markers, setMarkers] = useState<MapMarker[]>([]);
  
  // Effet pour gérer le rendu initial et les coordonnées en mode édition
  useEffect(() => {
    // Éviter les rendus multiples qui peuvent causer des boucles
    if (editMode && store.departure && store.destination && !renderedRef.current) {
      // Marquer comme rendu pour éviter les appels répétés
      renderedRef.current = true;
      
      // Forcer un re-rendu de la carte après chargement complet des données
      console.log("Forçage du rendu de la carte en mode édition - une seule fois");
      setMapKey(`map-edit-${Date.now()}`);
      setMapReady(true);
    }
  }, [editMode, store.departure, store.destination]);
  
  // Effet pour mettre à jour les marqueurs quand les coordonnées changent
  useEffect(() => {
    const newMarkers: MapMarker[] = [];
    
    if (store.departure && typeof store.departure.lat === 'number' && 
       typeof store.departure.lon === 'number') {
      newMarkers.push({
        position: [
          store.departure.lon,
          store.departure.lat
        ],
        address: store.departure.display_name,
        color: "green"
      });
    }
    
    if (store.destination && typeof store.destination.lat === 'number' && 
       typeof store.destination.lon === 'number') {
      newMarkers.push({
        position: [
          store.destination.lon,
          store.destination.lat
        ],
        address: store.destination.display_name,
        color: "red"
      });
    }
    
    setMarkers(newMarkers);
  }, [store.departure, store.destination]);

  const handleNextStep = () => {
    try {
      // Obtenir l'ID de réservation pour le mode édition
      const editingId = localStorage.getItem('currentEditingReservationId');
      
      console.log("Navigation vers la page de confirmation...", 
        editMode ? `(Mode édition, ID: ${editingId})` : "(Nouvelle réservation)");
      
      // Passer l'ID en paramètre de requête si en mode édition
      if (editMode && editingId) {
        router.push(`/reservation/confirmation?id=${editingId}`);
      } else {
        router.push("/reservation/confirmation");
      }
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

  // Adaptateurs pour les fonctions onSelect des inputs d'adresse
  const handleOriginSelect = (lat: number, lon: number, address: string) => {
    // Créer un objet Location complet au lieu de passer 3 paramètres séparés
    const locationData = {
      lat,
      lon,
      display_name: address,
      address: { formatted: address }
    };
    store.setDeparture(locationData);
  };

  const handleDestinationSelect = (lat: number, lon: number, address: string) => {
    // Créer un objet Location complet au lieu de passer 3 paramètres séparés
    const locationData = {
      lat,
      lon, 
      display_name: address,
      address: { formatted: address }
    };
    store.setDestination(locationData);
  };

  // Handler pour les calculs de route
  const handleRouteCalculated = (distance: number, duration: number) => {
    // Éviter les recalculs non nécessaires qui peuvent causer des boucles de rendu
    if (store.distance !== Math.round(distance / 1000) || 
        store.duration !== Math.round(duration / 60)) {
      store.setDistance(Math.round(distance / 1000)); // Convertir en km
      store.setDuration(Math.round(duration / 60)); // Convertir en minutes
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
                onSelect={handleOriginSelect}
                placeholder="Adresse de départ"
              />
            </div>

            <div>
              <Label>Destination</Label>
              <AutocompleteInput
                id="dropoff-location"
                value={store.destination?.display_name || ""}
                onSelect={handleDestinationSelect}
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
                    onCheckedChange={() => {
                      store.toggleOption("accueil");
                    }}
                  />
                  <Label htmlFor="accueil">Accueil personnalisé</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="boissons"
                    checked={store.selectedOptions.includes("boissons")}
                    onCheckedChange={() => {
                      store.toggleOption("boissons");
                    }}
                  />
                  <Label htmlFor="boissons">Boissons fraîches</Label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {store.departure && store.destination && (
          <Suspense fallback={<Card className="p-6"><LoadingSpinner /></Card>}>
            <Card className="p-0 overflow-hidden">
              <MapLibreMap
                key={mapKey}
                departure={store.departure}
                destination={store.destination}
                onRouteCalculated={handleRouteCalculated}
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
            disabled={!store.departure || !store.destination || !store.pickupDateTime || !store.selectedVehicle}
          >
            Continuer
          </Button>
        </div>
      </div>
    </div>
  );
};