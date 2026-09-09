"use client";

import { useEffect, useState } from "react";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MapPin, Flag } from "lucide-react";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { Coordinates } from "@/lib/types/map-types";
import DateTimeStep from "@/components/reservation/DateTimeStep";
import { formatDuration, cn } from "@/lib/utils";
import UnifiedMap from "@/components/map/UnifiedMap";
import { LANDING_CTA } from "@/components/landing/landingSurface";

/** Section chrome only from md — mobile stays edge-to-edge. */
const sectionClass =
  "md:rounded-2xl md:border md:border-blue-500/20 md:bg-blue-500/[0.04] md:p-6";

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
    <div
      className={cn(
        "space-y-6 sm:space-y-8",
        showMap &&
          "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-8 lg:space-y-0",
      )}
    >
      <div className="space-y-6 sm:space-y-8 lg:flex lg:flex-col lg:space-y-6">
      <section className={sectionClass}>
        <h2 className="mb-4 text-xl font-semibold lg:mb-5 lg:text-2xl">
          Sélectionner votre trajet
        </h2>

        <div className="space-y-5 sm:space-y-6">
          <div>
            <Label
              htmlFor="departure-input"
              className="mb-2 flex items-center gap-1.5 text-neutral-200"
            >
              Départ
              <MapPin className="h-4 w-4 text-emerald-400" aria-hidden />
            </Label>
            <AutocompleteInput
              id="departure-input"
              value={originAddress || store.departure?.display_name || ""}
              onChange={onOriginChange}
              onSelect={handleDepartureSelect}
              placeholder="Entrez une adresse de départ"
            />
          </div>

          <div>
            <Label
              htmlFor="destination-input"
              className="mb-2 flex items-center gap-1.5 text-neutral-200"
            >
              <Flag className="h-4 w-4 text-sky-400" aria-hidden />
              Destination
            </Label>
            <AutocompleteInput
              id="destination-input"
              value={
                destinationAddress || store.destination?.display_name || ""
              }
              onChange={onDestinationChange}
              onSelect={handleDestinationSelect}
              placeholder="Entrez une adresse de destination"
            />
          </div>
        </div>
      </section>

      {store.distance !== null &&
        store.duration !== null &&
        store.distance > 0 &&
        store.duration > 0 &&
        hasFiniteCoords(store.departure) &&
        hasFiniteCoords(store.destination) && (
          <section className={cn(sectionClass, "py-3 md:py-4")}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-neutral-400">Distance estimée</p>
                <p className="font-medium text-white">{store.distance} km</p>
              </div>
              <div>
                <p className="text-right text-sm text-neutral-400">
                  Durée estimée
                </p>
                <p className="text-right font-medium text-white">
                  {formatDuration(store.duration)}
                </p>
              </div>
            </div>
          </section>
        )}

      <section className={sectionClass}>
        <Label className="mb-2 block">Date et heure de prise en charge</Label>
        <DateTimeStep
          pickupDateTime={pickupDateTime || null}
          onDateTimeSelect={(date) => onDateTimeChange?.(date)}
        />
      </section>

      <div className="flex justify-stretch sm:justify-end">
        <Button
          onClick={onNextStep}
          disabled={!formValid}
          className={`w-full px-8 ${LANDING_CTA} sm:w-auto`}
        >
          {isEditing ? "Mettre à jour" : "Continuer"}
        </Button>
      </div>
      </div>

      {showMap ? (
        <section
          className={cn(
            "h-[min(42vh,280px)] overflow-hidden sm:h-[400px]",
            "rounded-lg border border-blue-500/20 md:rounded-2xl",
            "lg:h-[min(28rem,calc(100svh-9rem))] lg:self-start lg:rounded-3xl",
          )}
        >
          <UnifiedMap
            mode="REQUEST"
            key={mapKey}
            departure={store.departure}
            destination={store.destination}
            onRouteCalculated={handleRouteCalculated}
            height="100%"
          />
        </section>
      ) : null}
    </div>
  );
}

export default LocationStep;
