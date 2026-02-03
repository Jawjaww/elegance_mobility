"use client";

import React from 'react';
import DynamicMapLibreMap from './DynamicMapLibreMap';
import { MapProps, Location } from '@/lib/types/map-types';

export default function MapWrapper(props: MapProps) {
  // Mapper les props pour correspondre à DynamicMapLibreMap
  // Coordinates n'a que lat/lon, Location a besoin de display_name aussi
  const origin: Location | null = props.origin 
    ? { ...props.origin, display_name: 'Origin' }
    : props.startPoint 
      ? { ...props.startPoint, display_name: 'Origin' }
      : null;
      
  const destination: Location | null = props.destination
    ? { ...props.destination, display_name: 'Destination' }
    : props.endPoint
      ? { ...props.endPoint, display_name: 'Destination' }
      : null;

  return (
    <div className="h-full w-full">
      <DynamicMapLibreMap
        origin={origin}
        destination={destination}
        enableRouting={props.enableRouting}
        onRouteCalculated={props.onRouteCalculated}
      />
    </div>
  );
}
