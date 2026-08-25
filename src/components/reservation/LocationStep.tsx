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

// Use the unified map component (single map entrypoint)
import UnifiedMap from "@/components/map/UnifiedMap";

export interface LocationStepProps {
  onNextStep: () => void;
  isEditing?: boolean;
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

function hasFiniteCoords(
  loc: { lat?: number | null; lon?: number | null } | null | undefined,
): boolean {
  return (
    loc != null &&
    typeof loc.lat === "number" &&
    typeof loc.lon === "number" &&
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lon)
  );
}

export function LocationStep({
  onNextStep,
  isEditing = false,
  onOriginChange,
  onDestinationChange,
  onOriginSelect,
  onDestinationSelect,
  onRouteCalculated,
  onDateTimeChange,
  pickupDateTime,
  originAddress,
  destinationAddress,
}: Readonly<LocationStepProps>) {
  const store = useReservationStore();
  const [formValid, setFormValid] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [mapKey, setMapKey] = useState(() => `map-${Date.now()}`);

  useEffect(() => {
    const valid = Boolean(
      hasFiniteCoords(store.departure) &&
        hasFiniteCoords(store.destination) &&
        store.distance &&
        store.duration,
    );
    setFormValid(valid);
  }, [store.departure, store.destination, store.distance, store.duration]);

  useEffect(() => {
    const hasValidPoints =
      hasFiniteCoords(store.departure) || hasFiniteCoords(store.destination);

    if (hasValidPoints && !showMap) {
      const timer = setTimeout(() => {
        setShowMap(true);
      }, 100);
      return () => clearTimeout(timer);
    }
    if (!hasValidPoints && showMap) {
      setShowMap(false);
    }
  }, [store.departure, store.destination, showMap]);

  const handleDepartureSelect = (lat: number, lon: number, address: string) => {
    if (!address || address.trim() === "") {
      setMapKey(`map-dep-${Date.now()}`);
      setShowMap(false);

      setTimeout(() => {
        store.setDeparture(null);
        store.setDistance(0);
        store.setDuration(0);
        onOriginChange?.("");
        onOriginSelect?.("", { lat: 0, lon: 0 });
      }, 50);
      return;
    }

    store.setDeparture({
      lat,
      lon,
      display_name: address,
      address: {},
    });

    onOriginChange?.(address);
    onOriginSelect?.(address, { lat, lon });
  };

  const handleDestinationSelect = (
    lat: number,
    lon: number,
    address: string,
  ) => {
    if (!address || address.trim() === "") {
      setMapKey(`map-dest-${Date.now()}`);
      setShowMap(false);

      setTimeout(() => {
        store.setDestination(null);
        store.setDistance(0);
        store.setDuration(0);
        onDestinationChange?.("");
        onDestinationSelect?.("", { lat: 0, lon: 0 });
      }, 50);
      return;
    }

    store.setDestination({
      lat,
      lon,
      display_name: address,
      address: {},
    });

    onDestinationChange?.(address);
    onDestinationSelect?.(address, { lat, lon });
  };

  const handleRouteCalculated = (distance: number, duration: number = 0) => {
    const distanceKm = Math.round(distance / 1000);
    const durationMin = Math.round(duration / 60);

    store.setDistance(distanceKm);
    store.setDuration(durationMin);
    onRouteCalculated?.(distance, duration);
  };

  return (
    <div className="space-y-8">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">
          Sélectionner votre trajet
        </h2>

        <div className="space-y-6">
          <div>
            <Label className="mb-2 block">Point de départ</Label>
            <div className="relative">
              <div className="absolute left-3 top-3 text-neutral-500">
                <MapPin className="h-5 w-5" />
              </div>
              <AutocompleteInput
                id="departure-input"
                value={originAddress || store.departure?.display_name || ""}
                onChange={onOriginChange}
                onSelect={handleDepartureSelect}
                placeholder="Entrez une adresse de départ"
                className="pl-10"
              />
            </div>
          </div>

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
                onChange={onDestinationChange}
                onSelect={handleDestinationSelect}
                placeholder="Entrez une adresse de destination"
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </Card>

      {showMap && (
        <Card className="p-0 h-[min(42vh,280px)] sm:h-[400px] overflow-hidden">
          <UnifiedMap
            mode="REQUEST"
            key={mapKey}
            departure={store.departure}
            destination={store.destination}
            onRouteCalculated={handleRouteCalculated}
            height="100%"
          />
        </Card>
      )}

      {store.distance !== null &&
        store.duration !== null &&
        store.distance > 0 &&
        store.duration > 0 &&
        hasFiniteCoords(store.departure) &&
        hasFiniteCoords(store.destination) && (
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

      <Card className="p-4 bg-neutral-900">
        <Label className="mb-2 block">Date et heure de prise en charge</Label>
        <DateTimeStep
          pickupDateTime={pickupDateTime || null}
          onDateTimeSelect={(date) => onDateTimeChange?.(date)}
        />
      </Card>

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
