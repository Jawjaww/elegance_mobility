import type { GooglePlace } from '../lib/types';

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> => {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    await sleep(INITIAL_DELAY * (MAX_RETRIES - retries + 1));
    return withRetry(fn, retries - 1);
  }
};

const validateQuery = (query: string) => {
  if (!query || query.trim().length < 3) {
    throw new Error('La requête doit contenir au moins 3 caractères');
  }
};

export const geocodeAddress = async (query: string): Promise<GooglePlace[]> => {
  validateQuery(query);
  
  return withRetry(async () => {
    try {
      const service = new window.google.maps.places.AutocompleteService();
      const response = await service.getPlacePredictions({ 
        input: query,
        types: ['address']
      });

      if (!response?.predictions?.length) {
        return [];
      }

      const placesService = new window.google.maps.places.PlacesService(document.createElement('div'));
      
      // Limiter à 5 résultats maximum
      const limitedPredictions = response.predictions.slice(0, 5);
      
      const placesPromises = limitedPredictions.map(p => 
        new Promise<GooglePlace>((resolve, reject) => {
          placesService.getDetails({ placeId: p.place_id }, (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
              resolve({
                place_id: p.place_id,
                description: p.description,
                structured_formatting: {
                  main_text: p.structured_formatting.main_text,
                  secondary_text: p.structured_formatting.secondary_text
                },
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                }
              });
            } else {
              reject(new Error(`Erreur lors de la récupération des détails: ${status}`));
            }
          });
        })
      );

      return await Promise.all(placesPromises);
    } catch (error) {
      console.error('Erreur de géocodage:', error);
      return [];
    }
  });
};

export const reverseGeocode = async (lat: number, lng: number): Promise<GooglePlace | null> => {
  try {
    const geocoder = new window.google.maps.Geocoder();
    const response = await geocoder.geocode({ location: { lat, lng } });
    
    if (response.results[0]) {
      const place = response.results[0];
      return {
        place_id: place.place_id,
        description: place.formatted_address,
        structured_formatting: {
          main_text: place.address_components[0]?.long_name || '',
          secondary_text: place.address_components.slice(1).map(c => c.long_name).join(', ')
        },
        location: { lat, lng }
      };
    }
    return null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

export const getCurrentLocationAddress = async (): Promise<GooglePlace> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Géolocalisation non supportée"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const address = await reverseGeocode(position.coords.latitude, position.coords.longitude);
          if (address) {
            resolve(address);
          } else {
            reject(new Error("Adresse introuvable pour les coordonnées actuelles"));
          }
        } catch (error) {
          reject(error);
        }
      },
      (error) => reject(error)
    );
  });
};

export const getStaticMapUrl = (coords: { lat: number, lng: number }, options: { zoom?: number, size?: string } = {}) => {
  const { lat, lng } = coords;
  const zoom = options.zoom || 10;
  const size = options.size || '600x400';
  
  return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${size}&markers=color:red%7C${lat},${lng}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
};