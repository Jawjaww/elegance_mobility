'use client';

import { Suspense, useRef } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

// Interface de props pour le composant
interface ClientDynamicMapProps {
  origin: {lat: number, lon: number} | null;
  destination: {lat: number, lon: number} | null;
  className?: string;
}

// Import dynamique de ClientConfirmationMap sans SSR
const ClientConfirmationMap = dynamic(() => import("./ClientConfirmationMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-neutral-800/30 rounded-lg">
      <LoadingSpinner size="md" />
    </div>
  ),
});

// Composant d'enveloppe qui vérifie si au moins un point est défini
export default function ClientDynamicMap({
  origin,
  destination,
  className = '',
}: ClientDynamicMapProps) {
  // Référence pour suivre si le composant est monté
  const mountedRef = useRef(true);
  
  // Vérifier si au moins un point est défini
  const hasValidPoint = Boolean(
    (origin && typeof origin.lat === "number" && typeof origin.lon === "number") ||
    (destination && typeof destination.lat === "number" && typeof destination.lon === "number")
  );

  if (!hasValidPoint) {
    return (
      <div className={`flex items-center justify-center bg-neutral-800/30 rounded-lg ${className || 'client-map-confirmation'}`}>
        <p className="text-neutral-400 py-8">Aucune adresse sélectionnée</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className={`flex items-center justify-center bg-neutral-800/30 rounded-lg ${className || 'client-map-confirmation'}`}>
          <LoadingSpinner size="md" />
        </div>
      }
    >
      <ClientConfirmationMap
        origin={origin}
        destination={destination}
        className={className}
      />
    </Suspense>
  );
}
