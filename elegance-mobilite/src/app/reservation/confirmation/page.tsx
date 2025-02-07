"use client";

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { Coordinates } from '@/lib/types';
import type { MapMarker } from '@/lib/types';

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), { ssr: false });

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const [markers, setMarkers] = useState<MapMarker[]>([]);

  useEffect(() => {
    if (!searchParams) return;

    const originLat = searchParams.get('originLat');
    const originLng = searchParams.get('originLng');
    const destinationLat = searchParams.get('destinationLat');
    const destinationLng = searchParams.get('destinationLng');
    const originAddress = searchParams.get('originAddress');
    const destinationAddress = searchParams.get('destinationAddress');

    // Vérifier que tous les paramètres nécessaires sont présents
    if (!originLat || !originLng || !destinationLat || !destinationLng || !originAddress || !destinationAddress) {
      console.error('Paramètres manquants dans l\'URL');
      return;
    }

    const origin: Coordinates = {
      lat: parseFloat(originLat),
      lng: parseFloat(originLng)
    };
    
    const destination: Coordinates = {
      lat: parseFloat(destinationLat),
      lng: parseFloat(destinationLng)
    };

    // Vérifier que les coordonnées sont valides
    if (isNaN(origin.lat) || isNaN(origin.lng) || isNaN(destination.lat) || isNaN(destination.lng)) {
      console.error('Coordonnées invalides');
      return;
    }

    setMarkers([
      {
        position: [origin.lat, origin.lng],
        address: originAddress,
        color: 'darkgreen'
      },
      {
        position: [destination.lat, destination.lng],
        address: destinationAddress,
        color: 'red'
      }
    ]);
  }, [searchParams]);

  if (!searchParams) {
    return (
      <div className="min-h-screen bg-neutral-950 py-12">
        <div className="container mx-auto px-4 text-center text-neutral-100">
          Chargement...
        </div>
      </div>
    );
  }

  const originAddress = searchParams.get('originAddress') || 'Adresse non spécifiée';
  const destinationAddress = searchParams.get('destinationAddress') || 'Adresse non spécifiée';

  return (
    <div className="min-h-screen bg-neutral-950 py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-neutral-100 to-neutral-400 bg-clip-text text-transparent">
            Confirmation de votre réservation
          </h1>
          
          <div className="bg-neutral-900/50 backdrop-blur-lg border border-neutral-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-neutral-100 mb-4">
              Détails du trajet
            </h2>
            
            <div className="space-y-4 mb-6">
              <div className="text-neutral-300">
                <div className="font-medium">Point de départ :</div>
                <div>{originAddress}</div>
              </div>
              
              <div className="text-neutral-300">
                <div className="font-medium">Destination :</div>
                <div>{destinationAddress}</div>
              </div>
            </div>

            {markers.length > 0 && (
              <div className="rounded-lg overflow-hidden">
                <LeafletMap 
                  markers={markers}
                  enableRouting={true}
                  className="h-[400px] w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}