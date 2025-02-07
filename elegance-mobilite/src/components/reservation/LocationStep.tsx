"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import dynamic from "next/dynamic";
import type { LocationStepProps, MapMarker } from "@/lib/types";
import type { LatLngTuple } from "leaflet";

const LeafletMap = dynamic(() => import("@/components/map/LeafletMap"), { ssr: false });

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
  destination
}) => {
  const markers: MapMarker[] = [
    ...(origin ? [{
      position: [origin.lat, origin.lng] as LatLngTuple,
      address: originAddress,
      color: "darkgreen" as const
    }] : []),
    ...(destination ? [{
      position: [destination.lat, destination.lng] as LatLngTuple,
      address: destinationAddress,
      color: "red" as const
    }] : [])
  ];

  return (
    <div className="w-full min-h-screen bg-neutral-950">
      <div className="absolute inset-0 bg-[url('/map-bg.jpg')] bg-cover bg-center opacity-20" />
      
      <div className="relative z-10 container mx-auto px-4 py-12">
        <div className="w-full max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
              Réservez votre trajet
            </h1>
          </div>

          <div className="bg-neutral-900/50 backdrop-blur-lg border border-neutral-800 rounded-lg p-6 w-full">
            <div className="space-y-6">
              <div className="relative">
               <label className="text-lg font-semibold text-neutral-100 mb-2 block">
                 Point de départ
               </label>
               <div className="flex gap-2">
                 <div className="flex-1 relative z-50">
                   <AutocompleteInput
                     id="origin-input"
                     value={originAddress}
                     onChange={onOriginChange}
                     onSelect={onOriginSelect}
                     placeholder="Entrez votre adresse de départ"
                     className="w-full bg-neutral-800 text-neutral-100 border-neutral-700 placeholder:text-neutral-400"
                   />
                 </div>
               </div>
             </div>

              <div className="relative z-40">
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

              <div className="relative z-0 rounded-lg overflow-hidden h-[400px]">
                <LeafletMap
                  markers={markers}
                  enableRouting={!!(origin && destination)}
                  onRouteCalculated={onRouteCalculated}
                  className="h-full w-full"
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={onNext}
                  disabled={!origin || !destination}
                  className="inline-flex items-center justify-center hover:bg-primary/90 text-sm font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-11 rounded-md px-8 relative bg-gradient-to-r from-blue-600 to-blue-800 text-white hover:from-blue-500 hover:to-blue-700 transition-all duration-300 ease-out"
                >
                  Continuer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationStep;