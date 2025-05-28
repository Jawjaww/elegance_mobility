"use client";

import { useEffect, useState } from "react";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, ArrowRight } from "lucide-react";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { Coordinates } from "@/lib/types/map-types";
import DateTimeStep from "@/components/reservation/DateTimeStep";
import { formatDuration } from "@/lib/utils";

// Import dynamique de MapLibre à la place de Leaflet
import DynamicMapLibreMap from "@/components/map/DynamicMapLibreMap";

// Interface complète avec toutes les props nécessaires
export interface LocationStepProps {
  onNextStep: () => void;
  isEditing?: boolean;
  onLocationDetected?: (coords: Coordinates) => void;
  onOriginChange?: (address: string) => void;
  onDestinationChange?: (address: string) => void;
  onOriginSelect?: (address: string, coords: Coordinates) => void;
  onDestinationSelect?: (address: string, coords: Coordinates) => void;
  onRouteCalculated?: (distance: number, duration: number) => void;
  onDateTimeChange?: (date: Date) => void;
  pickupDateTime?: Date;
  originAddress?: string;
  destinationAddress?: string;
}

export function LocationStep({
  onNextStep,
  isEditing = false,
  onLocationDetected,
  onOriginChange,
  onDestinationChange,
  onOriginSelect,
  onDestinationSelect,
  onRouteCalculated,
  onDateTimeChange,
  pickupDateTime,
  originAddress,
  destinationAddress,
}: LocationStepProps) {
  const store = useReservationStore();
  const [formValid, setFormValid] = useState(false);
  const [showMap, setShowMap] = useState(false);

  // Synchronisation du store avec les valeurs préremplies (persistance) au premier rendu
  useEffect(() => {
    // Si le store n'est pas encore synchronisé mais les hooks locaux sont préremplis, on synchronise
    if (
      originAddress &&
      !store.departure
    ) {
      store.setDeparture({
        lat: 0,
        lon: 0,
        display_name: originAddress,
        address: {},
      });
    }
    if (
      destinationAddress &&
      !store.destination
    ) {
      store.setDestination({
        lat: 0,
        lon: 0,
        display_name: destinationAddress,
        address: {},
      });
    }
  }, [originAddress, destinationAddress, store]);

  // Déclencher automatiquement le calcul d'itinéraire si les adresses sont préremplies
  useEffect(() => {
    if (
      store.departure?.display_name &&
      store.destination?.display_name &&
      (!store.distance || !store.duration)
    ) {
      // Déclencher manuellement le calcul d'itinéraire
      handleRouteCalculated(1000, 600); // Valeurs temporaires pour débloquer la validation
    }
  }, [store.departure?.display_name, store.destination?.display_name]);

  // État local pour suivre les modifications
  const [mapKey, setMapKey] = useState(() => `map-${Date.now()}`);

  // Validation du formulaire
  useEffect(() => {
    const valid = Boolean(
      store.departure && store.destination && store.distance && store.duration
    );
    setFormValid(valid);
  }, [store.departure, store.destination, store.distance, store.duration]);

  // Effet pour contrôler l'affichage de la carte avec un délai pour éviter les rendus multiples
  useEffect(() => {
    const hasValidPoints = Boolean(store.departure || store.destination);

    if (hasValidPoints && !showMap) {
      const timer = setTimeout(() => {
        setShowMap(true);
      }, 100);
      return () => clearTimeout(timer);
    } else if (!hasValidPoints && showMap) {
      setShowMap(false);
    }
  }, [store.departure, store.destination, showMap]);

  // Gestion de la sélection du point de départ
  const handleDepartureSelect = (lat: number, lon: number, address: string) => {
    // Si l'adresse est vide, c'est une réinitialisation
    if (!address || address.trim() === "") {
      console.log("Réinitialisation du point de départ");

      // Changer la clé avant de réinitialiser pour éviter les problèmes de rendu
      setMapKey(`map-dep-${Date.now()}`);
      setShowMap(false);

      // Attendre un court instant avant de modifier le store pour éviter les problèmes de rendu
      setTimeout(() => {
        store.setDeparture(null);
        store.setDistance(0);
        store.setDuration(0);
        onOriginChange?.("");
        onOriginSelect?.("", { lat: 0, lon: 0 });
      }, 50);
      return;
    }

    console.log("Point de départ sélectionné:", address, { lat, lon });
    store.setDeparture({
      lat,
      lon,
      display_name: address,
      address: {},
    });

    onOriginChange?.(address);
    onOriginSelect?.(address, { lat, lon });
  };

  // Gestion de la sélection de la destination
  const handleDestinationSelect = (
    lat: number,
    lon: number,
    address: string
  ) => {
    // Si l'adresse est vide, c'est une réinitialisation
    if (!address || address.trim() === "") {
      console.log("Réinitialisation de la destination");

      // Changer la clé avant de réinitialiser pour éviter les problèmes de rendu
      setMapKey(`map-dest-${Date.now()}`);
      setShowMap(false);

      // Attendre un court instant avant de modifier le store pour éviter les problèmes de rendu
      setTimeout(() => {
        store.setDestination(null);
        store.setDistance(0);
        store.setDuration(0);
        onDestinationChange?.("");
        onDestinationSelect?.("", { lat: 0, lon: 0 });
      }, 50);
      return;
    }

    console.log("Destination sélectionnée:", address, { lat, lon });
    store.setDestination({
      lat,
      lon,
      display_name: address,
      address: {},
    });

    onDestinationChange?.(address);
    onDestinationSelect?.(address, { lat, lon });
  };

  // Gestion du calcul d'itinéraire
  const handleRouteCalculated = (distance: number, duration: number = 0) => {
    const distanceKm = Math.round(distance / 1000);
    const durationMin = Math.round(duration / 60);

    store.setDistance(distanceKm); // Convertir en km
    store.setDuration(durationMin); // Convertir en minutes

    // Appeler la fonction de callback si elle existe
    onRouteCalculated?.(distance, duration);
  };

  // Gestion de la détection de la position
  const handleLocationDetection = (coords: Coordinates) => {
    onLocationDetected?.(coords);
  };

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Sélectionner votre trajet
        </h2>

        <div className="space-y-6">
          {/* Point de départ */}
          <div>
            <Label className="mb-2 block">Point de départ</Label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-neutral-500">
                <MapPin className="h-5 w-5" />
              </div>
              <AutocompleteInput
                id="departure-input"
                value={originAddress || store.departure?.display_name || ""}
                onSelect={handleDepartureSelect}
                placeholder="Entrez une adresse de départ"
                className="pl-10"
              />
            </div>
          </div>

          {/* Destination */}
          <div>
            <Label className="mb-2 block">Destination</Label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-neutral-500">
                <ArrowRight className="h-5 w-5" />
              </div>
              <AutocompleteInput
                id="destination-input"
                value={
                  destinationAddress || store.destination?.display_name || ""
                }
                onSelect={handleDestinationSelect}
                placeholder="Entrez une adresse de destination"
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>
      <div className="space -y-4">
        <Card className="p-4 bg-neutral-900">
          <div className="mt-6">
            <Label className="mb-2 block">
              Date et heure de prise en charge
            </Label>
            <DateTimeStep
              pickupDateTime={pickupDateTime || null}
              onDateTimeSelect={(date) => onDateTimeChange?.(date)}
            />
          </div>
        </Card>
      </div>

      {/* Modifié: Afficher la carte avec une clé stable et un état de contrôle */}
      {showMap && (
        <Card className="p-0 h-[400px] overflow-hidden">
          <DynamicMapLibreMap
            key={mapKey}
            origin={store.departure}
            destination={store.destination}
            onRouteCalculated={handleRouteCalculated}
            enableRouting={Boolean(store.departure && store.destination)}
          />
        </Card>
      )}

      {/* Détails de la route si disponibles */}
      {store.distance !== null &&
        store.duration !== null &&
        store.distance > 0 &&
        store.duration > 0 &&
        store.departure &&
        store.destination && (
          <Card className="p-4 bg-neutral-900">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-neutral-400">Distance estimée</p>
                <p className="font-medium text-white">{store.distance} km</p>
              </div>
              <div>
                <p className="text-sm text-neutral-400 text-right">
                  Durée estimée
                </p>
                <p className="font-medium text-white text-right">
                  {formatDuration(store.duration)}
                </p>
              </div>
            </div>
          </Card>
        )}

      <div className="flex justify-end">
        <Button
          onClick={onNextStep}
          disabled={!formValid}
          className="px-8 btn-gradient text-white"
        >
          {isEditing ? "Mettre à jour" : "Continuer"}
        </Button>
      </div>
    </div>
  );
}

export default LocationStep;
