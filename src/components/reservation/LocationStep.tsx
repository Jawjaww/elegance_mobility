"use client";

import { useEffect, useState } from "react";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { Coordinates } from "@/lib/types/map-types";
import DateTimeStep from "@/components/reservation/DateTimeStep";
import { TripEndpointRail } from "@/components/reservation/TripEndpointRail";
import { formatDuration, cn } from "@/lib/utils";
import UnifiedMap from "@/components/map/UnifiedMap";
import { LANDING_CTA } from "@/components/landing/landingSurface";

/** Section chrome only from md — mobile stays edge-to-edge. */
const sectionClass =
  "md:rounded-2xl md:border md:border-blue-500/20 md:bg-blue-500/[0.04] md:p-6";

const desktopContinueButtonClass = cn(
  LANDING_CTA,
  "min-h-11 px-10 text-base lg:w-full lg:max-w-none",
);

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

  const hasTripStats =
    store.distance !== null &&
    store.duration !== null &&
    store.distance > 0 &&
    store.duration > 0 &&
    hasFiniteCoords(store.departure) &&
    hasFiniteCoords(store.destination);

  return (
    <div
      className={cn(
        "grid gap-3 sm:gap-6",
        showMap &&
          "lg:max-h-[calc(100svh-13rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-stretch lg:gap-6",
      )}
    >
      {/*
        Mobile: `contents` so children keep order (addresses → map → meta → CTA).
        Desktop: one left column so distance/datetime sit beside the map, not below it.
      */}
      <div
        className={cn(
          "contents lg:col-start-1 lg:row-start-1 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:gap-5",
          "lg:rounded-2xl lg:border lg:border-blue-500/20 lg:bg-blue-500/[0.04] lg:p-6",
        )}
      >
        <section
          className={cn(
            sectionClass,
            "order-1 lg:flex lg:flex-1 lg:flex-col lg:rounded-none lg:border-0 lg:bg-transparent lg:p-0",
          )}
        >
          <h2 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl lg:mb-5 lg:text-2xl">
            Sélectionner votre trajet
          </h2>

          <div className="flex flex-1 gap-2.5 sm:gap-3 lg:gap-4">
            <TripEndpointRail className="pt-6 sm:pt-8 lg:pt-9" />

            <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-6 lg:flex lg:flex-col lg:justify-center lg:gap-6 lg:space-y-0 lg:py-2">
              <div>
                <Label
                  htmlFor="departure-input"
                  className="mb-1 block text-sm text-neutral-200 sm:mb-2 sm:text-base lg:mb-2"
                >
                  Départ
                </Label>
                <AutocompleteInput
                  id="departure-input"
                  value={originAddress || store.departure?.display_name || ""}
                  onChange={onOriginChange}
                  onSelect={handleDepartureSelect}
                  placeholder="Adresse de départ"
                />
              </div>

              <div>
                <Label
                  htmlFor="destination-input"
                  className="mb-1 block text-sm text-neutral-200 sm:mb-2 sm:text-base lg:mb-2"
                >
                  Destination
                </Label>
                <AutocompleteInput
                  id="destination-input"
                  value={
                    destinationAddress || store.destination?.display_name || ""
                  }
                  onChange={onDestinationChange}
                  onSelect={handleDestinationSelect}
                  placeholder="Adresse de destination"
                />
              </div>
            </div>
          </div>
        </section>

        <section
          className={cn(
            sectionClass,
            "order-3 lg:mt-auto lg:rounded-none lg:border-x-0 lg:border-b-0 lg:bg-transparent lg:p-0 lg:border-t lg:border-blue-500/20 lg:pt-5",
          )}
        >
          {hasTripStats ? (
            <p className="mb-2.5 flex items-center justify-between gap-3 text-sm sm:mb-3 lg:mb-3">
              <span>
                <span className="text-neutral-400">Distance </span>
                <span className="font-medium text-white">
                  {store.distance} km
                </span>
              </span>
              <span className="text-right">
                <span className="text-neutral-400">Durée </span>
                <span className="font-medium text-white">
                  {formatDuration(store.duration)}
                </span>
              </span>
            </p>
          ) : null}
          <Label className="mb-1 block text-sm sm:mb-2 sm:text-base lg:mb-2">
            Date et heure de prise en charge
          </Label>
          <DateTimeStep
            pickupDateTime={pickupDateTime || null}
            onDateTimeSelect={(date) => onDateTimeChange?.(date)}
          />
        </section>

        <div
          className={cn(
            "order-5 flex justify-stretch sm:justify-end",
            showMap && "lg:hidden",
          )}
        >
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
        <div className="order-2 flex h-44 min-h-0 flex-col gap-3 sm:h-[400px] lg:col-start-2 lg:row-start-1 lg:h-full lg:self-stretch">
          <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-blue-500/20 md:rounded-2xl lg:min-h-[18rem] lg:rounded-3xl">
            <UnifiedMap
              mode="REQUEST"
              key={mapKey}
              departure={store.departure}
              destination={store.destination}
              onRouteCalculated={handleRouteCalculated}
              height="100%"
            />
          </section>
          <div className="hidden shrink-0 lg:block lg:w-full">
            <Button
              onClick={onNextStep}
              disabled={!formValid}
              className={desktopContinueButtonClass}
            >
              {isEditing ? "Mettre à jour" : "Continuer"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default LocationStep;
