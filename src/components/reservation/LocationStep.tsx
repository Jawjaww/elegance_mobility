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
          "lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-start lg:gap-8",
      )}
    >
      <section className={cn(sectionClass, "order-1 lg:col-start-1")}>
        <h2 className="mb-3 text-lg font-semibold sm:mb-4 sm:text-xl lg:mb-5 lg:text-2xl">
          Sélectionner votre trajet
        </h2>

        <div className="flex gap-2.5 sm:block sm:space-y-6">
          <div
            className="flex w-3 shrink-0 flex-col items-center pt-6 sm:hidden"
            aria-hidden
          >
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/15" />
            <span className="my-1 w-px flex-1 bg-gradient-to-b from-emerald-400/50 to-sky-400/50" />
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400 ring-4 ring-sky-400/15" />
          </div>

          <div className="min-w-0 flex-1 space-y-2.5 sm:space-y-6">
            <div>
              <Label
                htmlFor="departure-input"
                className="mb-1 flex items-center gap-1.5 text-sm text-neutral-200 sm:mb-2 sm:text-base"
              >
                Départ
                <MapPin
                  className="hidden h-4 w-4 text-emerald-400 sm:inline"
                  aria-hidden
                />
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
                className="mb-1 flex items-center gap-1.5 text-sm text-neutral-200 sm:mb-2 sm:text-base"
              >
                Destination
                <Flag
                  className="hidden h-4 w-4 text-sky-400 sm:inline"
                  aria-hidden
                />
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

      {showMap ? (
        <section
          className={cn(
            "order-2 overflow-hidden rounded-lg border border-blue-500/20",
            "h-44 sm:h-[400px] md:rounded-2xl",
            "lg:order-2 lg:col-start-2 lg:row-start-1 lg:row-span-4 lg:h-[min(28rem,calc(100svh-9rem))] lg:self-start lg:rounded-3xl",
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

      {hasTripStats ? (
        <p className="order-3 flex items-center justify-between gap-3 text-sm lg:col-start-1 sm:rounded-2xl sm:border sm:border-blue-500/20 sm:bg-blue-500/[0.04] sm:px-6 sm:py-4">
          <span>
            <span className="text-neutral-400">Distance </span>
            <span className="font-medium text-white">{store.distance} km</span>
          </span>
          <span className="text-right">
            <span className="text-neutral-400">Durée </span>
            <span className="font-medium text-white">
              {formatDuration(store.duration)}
            </span>
          </span>
        </p>
      ) : null}

      <section className={cn(sectionClass, "order-4 lg:col-start-1")}>
        <Label className="mb-1 block text-sm sm:mb-2 sm:text-base">
          Date et heure de prise en charge
        </Label>
        <DateTimeStep
          pickupDateTime={pickupDateTime || null}
          onDateTimeSelect={(date) => onDateTimeChange?.(date)}
        />
      </section>

      <div className="order-5 flex justify-stretch sm:justify-end lg:col-start-1">
        <Button
          onClick={onNextStep}
          disabled={!formValid}
          className={`w-full px-8 ${LANDING_CTA} sm:w-auto`}
        >
          {isEditing ? "Mettre à jour" : "Continuer"}
        </Button>
      </div>
    </div>
  );
}

export default LocationStep;
