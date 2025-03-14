"use client";

import React from 'react';
import DynamicMapLibreMap from './DynamicMapLibreMap';
import { MapProps } from '@/lib/types/map-types';

export default function MapWrapper(props: MapProps) {
  return (
    <div className="h-full w-full">
      <DynamicMapLibreMap {...props} />
    </div>
  );
}
