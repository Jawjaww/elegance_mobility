'use client';

import dynamic from 'next/dynamic';
import { Suspense, useState, useEffect } from 'react';
import '@/styles/maplibre.css';
import type { Database } from '@/lib/types/database.types';

type RideRow = Database["public"]["Tables"]["rides"]["Row"];

// Import dynamique pour éviter les problèmes SSR
const StableMapLibreMap = dynamic(
  () => import('./StableMapLibreMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Chargement de la carte...</p>
        </div>
      </div>
    )
  }
);

// Props de la carte
interface MapLibreWrapperProps {
  availableRides?: RideRow[];
  selectedRide?: RideRow | null;
  driverLocation?: [number, number];
  onRideSelect?: (ride: RideRow) => void;
  onRideAccept?: (ride: RideRow) => void;
  className?: string;
  isOnline?: boolean;
}

// Wrapper pour la carte avec Suspense et loading fallback
// Fonction utilitaire pour nettoyer les contrôles dupliqués
const cleanupDuplicateControls = () => {
  if (typeof window === 'undefined') return;
  
  // Exécuter après un délai pour s'assurer que tous les éléments sont chargés
  setTimeout(() => {
    const controls = document.querySelectorAll('.maplibregl-ctrl-group');
    
    if (controls.length > 2) {
      console.log(`🔄 Nettoyage automatique de ${controls.length - 2} contrôles dupliqués`);
      
      // Nous gardons seulement le premier groupe de chaque type de contrôle
      const navigationControls = document.querySelectorAll('.maplibregl-ctrl-zoom-in');
      const geolocateControls = document.querySelectorAll('.maplibregl-ctrl-geolocate');
      
      if (navigationControls.length > 1) {
        for (let i = 1; i < navigationControls.length; i++) {
          const parent = navigationControls[i].closest('.maplibregl-ctrl-group');
          if (parent) parent.classList.add('maplibregl-ctrl-hidden');
        }
      }
      
      if (geolocateControls.length > 1) {
        for (let i = 1; i < geolocateControls.length; i++) {
          const parent = geolocateControls[i].closest('.maplibregl-ctrl-group');
          if (parent) parent.classList.add('maplibregl-ctrl-hidden');
        }
      }
    }
  }, 1000);
};

export default function MapLibreWrapper({
  availableRides = [],
  selectedRide = null,
  driverLocation,
  onRideSelect,
  onRideAccept,
  className = "w-full h-full",
  isOnline = false
}: MapLibreWrapperProps) {
  const [hasError, setHasError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Gestion des erreurs et tentatives de récupération
  useEffect(() => {
    // Si une erreur est détectée, tenter de récupérer après un délai
    if (hasError && retryCount < 3) {
      const timer = setTimeout(() => {
        console.log(`🔄 Tentative de récupération de la carte (${retryCount + 1}/3)...`);
        setHasError(false);
        setRetryCount(prev => prev + 1);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [hasError, retryCount]);
  
  // Capture globale des erreurs non gérées liées à MapLibre
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      if (event.message?.includes('maplibre') || 
          event.error?.stack?.includes('maplibre') ||
          event.error?.message?.includes('WebGL')) {
        console.error('🚨 Erreur MapLibre détectée:', event.message);
        setHasError(true);
        event.preventDefault(); // Empêcher l'affichage de l'erreur dans la console
      }
    };
    
    window.addEventListener('error', handleGlobalError);
    
    // Nettoyer les contrôles dupliqués au chargement
    cleanupDuplicateControls();
    
    return () => window.removeEventListener('error', handleGlobalError);
  }, []);

  // Appel de la fonction de nettoyage des contrôles dupliqués
  useEffect(() => {
    cleanupDuplicateControls();
  }, []);
  
  if (hasError && retryCount >= 3) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-4">
          <div className="text-red-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2 border-2 border-red-500">
            ⚠️
          </div>
          <p className="font-medium text-red-700">Problème d'affichage de la carte</p>
          <p className="text-sm text-red-600 mt-1">Essayez de rafraîchir la page</p>
          <button 
            className="mt-3 px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
            onClick={() => window.location.reload()}
          >
            Recharger l'application
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <Suspense
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Chargement de la carte...</p>
          </div>
        </div>
      }
    >
      <StableMapLibreMap
        availableRides={availableRides}
        selectedRide={selectedRide}
        driverLocation={driverLocation}
        onRideSelect={onRideSelect}
        onRideAccept={onRideAccept}
        isOnline={isOnline}
        className={className}
        key={`map-instance-${retryCount}`}
      />
    </Suspense>
  );
}
