"use client";

import UnifiedMap from "./UnifiedMap";
import type { Location } from "@/lib/types/map-types";

interface ReservationMapProps {
  departure: Location | null;
  destination: Location | null;
  onRouteCalculated?: (distance: number, duration: number) => void;
  className?: string;
  height?: string;
}

export default function ReservationMap({
  departure,
  destination,
  onRouteCalculated,
  className,
  height,
}: ReservationMapProps) {
  // UnifiedMap accepts legacy `departure`/`destination` shapes (lat, lon)
  return (
    <UnifiedMap
      mode="REQUEST"
      departure={departure ?? undefined}
      destination={destination ?? undefined}
      onRouteCalculated={onRouteCalculated}
      height={height ?? (className ? undefined : "100%")}
    />
  );
}
