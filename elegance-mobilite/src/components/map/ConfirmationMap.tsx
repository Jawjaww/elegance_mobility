"use client";

import DynamicMapLibreMap from './DynamicMapLibreMap';

interface ConfirmationMapProps {
  departure: { lat: number; lon: number; display_name: string } | null;
  destination: { lat: number; lon: number; display_name: string } | null;
}

export function ConfirmationMap({ departure, destination }: ConfirmationMapProps) {
  return (
    <DynamicMapLibreMap
      origin={departure}
      destination={destination}
      enableRouting={!!departure && !!destination}
    />
  );
}
