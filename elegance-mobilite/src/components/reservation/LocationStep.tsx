"use client";

import React, { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import dynamic from "next/dynamic";
import type { LocationStepProps, MapMarker } from "@/lib/types";
import type { LatLngTuple } from "leaflet";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[400px] rounded-lg bg-neutral-800/50 animate-pulse" />
  ),
});

const LocationStep: React.FC<LocationStepProps> = ({
  originAddress,
  destinationAddress,
  onOriginChange,
  onDestinationChange,
  onOriginSelect,
  onDestinationSelect,
  onRouteCalculated,
  onNext,
  origin,
  destination,
  pickupDateTime,
  onDateTimeChange,
}) => {
  const markers: MapMarker[] = useMemo(
    () => [
      ...(origin
        ? [
            {
              position: [origin.lat, origin.lng] as LatLngTuple,
              address: originAddress,
              color: "darkgreen" as const,
            },
          ]
        : []),
      ...(destination
        ? [
            {
              position: [destination.lat, destination.lng] as LatLngTuple,
              address: destinationAddress,
              color: "red" as const,
            },
          ]
        : []),
    ],
    [origin, destination, originAddress, destinationAddress]
  );

  const isNextDisabled = !origin || !destination;

  return (
    <div className="space-y-8">
      <div className="grid gap-6">
        <div>
          <label className="text-lg font-semibold text-neutral-100 mb-2 block">
            Point de départ
          </label>
          <AutocompleteInput
            id="origin-input"
            value={originAddress}
            onChange={onOriginChange}
            onSelect={onOriginSelect}
            placeholder="Entrez votre adresse de départ"
            className="w-full bg-neutral-800 text-neutral-100 border-neutral-700 placeholder:text-neutral-400"
          />
        </div>

        <DateTimePicker
          id="pickup-datetime"
          label="Date et heure de prise en charge"
          value={pickupDateTime}
          onChange={onDateTimeChange}
        />

        <div>
          <label className="text-lg font-semibold text-neutral-100 mb-2 block">
            Destination
          </label>
          <AutocompleteInput
            id="destination-input"
            value={destinationAddress}
            onChange={onDestinationChange}
            onSelect={onDestinationSelect}
            placeholder="Entrez votre destination"
            className="w-full bg-neutral-800 text-neutral-100 border-neutral-700 placeholder:text-neutral-400"
          />
        </div>
      </div>

      <div className="relative rounded-lg overflow-hidden">
        <LeafletMap
          markers={markers}
          enableRouting={!!(origin && destination)}
          onRouteCalculated={onRouteCalculated}
          className="h-[400px]"
        />
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={isNextDisabled}
          className="py-2 inline-flex items-center justify-center text-sm font-medium ring-offset-background disabled:pointer-events-none disabled:opacity-50 h-11 px-8 bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300 ease-out rounded-md"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
};

export default React.memo(LocationStep);