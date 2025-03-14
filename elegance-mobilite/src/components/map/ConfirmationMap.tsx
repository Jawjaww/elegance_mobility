"use client";

import DynamicLeafletMap from './DynamicLeafletMap';
import type { MapMarker } from '@/lib/types/types';

interface ConfirmationMapProps {
  departure: { lat: number; lon: number; display_name: string } | null;
  destination: { lat: number; lon: number; display_name: string } | null;
}

export function ConfirmationMap({ departure, destination }: ConfirmationMapProps) {
  const markers: MapMarker[] = [
    ...(departure ? [{
      position: [departure.lat, departure.lon] as [number, number],
      address: departure.display_name,
      color: 'darkgreen' as const,
      icon: 'map-marker'
    }] : []),
    ...(destination ? [{
      position: [destination.lat, destination.lon] as [number, number],
      address: destination.display_name,
      color: 'red' as const,
      icon: 'map-marker'
    }] : [])
  ];

  return (
    <DynamicLeafletMap
      markers={markers}
      enableRouting={markers.length === 2}
      className="h-full"
    />
  );
}