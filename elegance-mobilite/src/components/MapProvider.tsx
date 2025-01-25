"use client";

import { 
  createContext, 
  useContext, 
  useEffect, 
  useState, 
  ReactNode 
} from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface MapContextValue {
  isLoaded: boolean;
  loader: Loader | null;
}

const MapContext = createContext<MapContextValue>({
  isLoaded: false,
  loader: null,
});

export const useMap = () => useContext(MapContext);

export function MapProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<MapContextValue>({
    isLoaded: false,
    loader: null,
  });

  // Initialisation unique du loader
  useEffect(() => {
    let isMounted = true;
    
    const initMap = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
          throw new Error('API key manquante pour Google Maps');
        }

        // Vérifier si le loader est déjà initialisé
        if (!state.loader) {
          const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
            libraries: ['places', 'marker'],
            version: 'weekly',
          });

          await loader.load();

          if (isMounted) {
            setState({
              isLoaded: true,
              loader,
            });
          }
        }
      } catch (error) {
        console.error('Erreur de chargement Google Maps:', error);
        if (isMounted) {
          setState({
            isLoaded: false,
            loader: null,
          });
        }
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, [state.loader]);

  return (
    <MapContext.Provider value={state}>
      {children}
    </MapContext.Provider>
  );
}
