"use client";

import { Suspense, useEffect, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Location } from "@/lib/types/map-types";

// Interface de props pour le composant
interface DynamicMapLibreMapProps {
  origin: Location | null;
  destination: Location | null;
  onRouteCalculated?: (distance: number, duration: number) => void;
  enableRouting?: boolean;
}

// Import dynamique de MapLibreMap sans SSR
const MapLibreMap = dynamic(() => import("./MapLibreMap"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center w-full h-full bg-neutral-800/30">
      <LoadingSpinner size="lg" />
    </div>
  ),
});

// Composant d'enveloppe qui vérifie si au moins un point est défini
export default function DynamicMapLibreMap({
  origin,
  destination,
  onRouteCalculated,
  enableRouting = true,
}: DynamicMapLibreMapProps) {
  // Référence pour suivre si le composant est monté
  const mountedRef = useRef(true);
  
  // Générer une clé qui ne change que si origin ou destination change substantiellement
  const mapKey = useMemo(() => {
    const originKey = origin ? `${origin.lat.toFixed(5)},${origin.lon.toFixed(5)}` : 'null';
    const destKey = destination ? `${destination.lat.toFixed(5)},${destination.lon.toFixed(5)}` : 'null';
    return `map-${originKey}-${destKey}`;
  }, [
    origin?.lat, 
    origin?.lon,
    destination?.lat, 
    destination?.lon
  ]);
  
  // Nettoyer les éventuels éléments orphelins de carte lors du démontage
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      
      // Essayer de nettoyer les éléments orphelins de carte
      setTimeout(() => {
        if (!mountedRef.current) {
          // Si le composant n'est plus monté, on peut nettoyer les canvas inutilisés
          document.querySelectorAll('.maplibregl-canvas-container:not(:has(canvas))').forEach(el => {
            el.remove();
          });
          
          // Nettoyer les marqueurs orphelins aussi
          document.querySelectorAll('.maplibregl-marker').forEach(el => {
            if (!el.isConnected || !document.contains(el.parentElement)) {
              el.remove();
            }
          });
        }
      }, 500);
    };
  }, []);

  // Vérifier si au moins un point est défini
  const hasValidPoint = Boolean(
    (origin && typeof origin.lat === "number" && typeof origin.lon === "number") ||
    (destination && typeof destination.lat === "number" && typeof destination.lon === "number")
  );

  if (!hasValidPoint) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-neutral-800/30">
        <p className="text-neutral-400">Veuillez sélectionner au moins une adresse</p>
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center w-full h-full bg-neutral-800/30">
          <LoadingSpinner size="lg" />
        </div>
      }
    >
      <MapLibreMap
        key={mapKey}
        departure={origin}
        destination={destination}
        onRouteCalculated={onRouteCalculated}
        enableRouting={enableRouting}
      />
    </Suspense>
  );
}
