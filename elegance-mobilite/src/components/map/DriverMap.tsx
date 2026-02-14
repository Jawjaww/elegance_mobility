"use client";

import UnifiedMap from "./UnifiedMap";
import { useDriverStore } from "@/lib/driver/store";

interface Coord {
  lat: number;
  lng: number;
}

interface DriverMapProps {
  pickup?: Coord | null;
  dropoff?: Coord | null;
  height?: string;
  onReady?: () => void;
}

export default function DriverMap({
  pickup,
  dropoff,
  height,
  onReady,
}: DriverMapProps) {
  const { currentLocation } = useDriverStore();

  const driverLocation = currentLocation
    ? {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
        heading: currentLocation.heading ?? undefined,
      }
    : undefined;

  return (
    <UnifiedMap
      mode="TRACKING"
      pickup={pickup ?? undefined}
      dropoff={dropoff ?? undefined}
      driverLocation={driverLocation}
      onReady={onReady}
      height={height}
    />
  );
}
