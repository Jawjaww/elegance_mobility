"use client";
 import dynamic from 'next/dynamic';
import type { LocationStepProps } from '../../lib/types/types';

const DynamicLocationStep = dynamic<LocationStepProps>(() => import('./LocationStep').then(mod => mod.default), {
  ssr: false,
  loading: () => (
    <div className="w-full p-4">
      <div className="h-64 bg-neutral-800 rounded-lg animate-pulse mb-4" />
      <div className="space-y-2">
        <div className="h-10 bg-neutral-800 rounded animate-pulse" />
        <div className="h-10 bg-neutral-800 rounded animate-pulse" />
      </div>
    </div>
  )
});

export type { LocationStepProps };
export default DynamicLocationStep;