import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';
import { Location, ReservationStore } from '@/lib/types/reservation.types';

// Fonction de normalisation utilisant uniquement lon
function normalizeLocation(location: any): Location | null {
  try {
    // Cas explicite pour null ou undefined
    if (location === null || location === undefined) {
      return null;
    }

    // Vérifier le type de l'objet
    if (typeof location !== 'object') {
      throw new Error("Format de données incorrect");
    }

    // Validation et conversion des coordonnées
    const lat = typeof location.lat === 'number' ? location.lat : 
                typeof location.lat === 'string' ? parseFloat(location.lat) : null;
    const lon = typeof location.lon === 'number' ? location.lon : 
                typeof location.lon === 'string' ? parseFloat(location.lon) : null;

    // Vérification des valeurs
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      throw new Error("Coordonnées invalides");
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new Error("Coordonnées hors limites");
    }

    // Construction de l'objet normalisé
    return {
      lat,
      lon,
      display_name: typeof location.display_name === 'string' ? location.display_name : "",
      address: typeof location.address === 'object' ? location.address : {}
    };
  } catch (error) {
    console.error("[Store] Erreur de normalisation:", error);
    return null;
  }
}

const initialState = {
  departure: null,
  destination: null,
  pickupDateTime: new Date(),
  distance: null,
  duration: null,
  selectedVehicle: '',
  selectedOptions: [],
  step: 1,
};

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      setDeparture: (location) => {
        const normalized = normalizeLocation(location);
        set(() => ({ departure: normalized }));
      },

      setDestination: (location) => {
        const normalized = normalizeLocation(location);
        set(() => ({ destination: normalized }));
      },

      setPickupDateTime: (date) => {
        // Validation et conversion de la date
        try {
          const validDate = date instanceof Date ? new Date(date.getTime()) : new Date(date);
          if (isNaN(validDate.getTime())) {
            throw new Error("Date invalide");
          }
          set(() => ({ pickupDateTime: validDate }));
        } catch (error) {
          console.error("[Store] Erreur lors de la définition de la date:", error);
          // En cas d'erreur, utiliser l'heure actuelle + 3h comme fallback
          const fallbackDate = new Date();
          fallbackDate.setHours(fallbackDate.getHours() + 3);
          set(() => ({ pickupDateTime: fallbackDate }));
        }
      },

      setDistance: (distance) =>
        set(() => ({
          distance,
        })),

      setDuration: (duration) =>
        set(() => ({
          duration,
        })),

      setSelectedVehicle: (vehicle) =>
        set(() => ({
          selectedVehicle: vehicle,
        })),

      toggleOption: (option) =>
        set((state) => ({
          selectedOptions: state.selectedOptions.includes(option)
            ? state.selectedOptions.filter((o) => o !== option)
            : [...state.selectedOptions, option],
        })),

      setSelectedOptions: (options) =>
        set(() => ({
          selectedOptions: options,
        })),

      setStep: (step) =>
        set(() => ({
          step,
        })),

      reset: () =>
        set(() => ({
          ...initialState,
          pickupDateTime: new Date(), // Toujours utiliser une nouvelle instance
        })),

      addMinutesToPickupTime: (minutes) =>
        set((state) => {
          const newDate = new Date(state.pickupDateTime.getTime());
          newDate.setMinutes(newDate.getMinutes() + minutes);
          return { pickupDateTime: newDate };
        }),

      updatePickupDate: (date) =>
        set((state) => {
          try {
            const currentDate = new Date(state.pickupDateTime);
            const newDate = new Date(date);
            
            // Conserver l'heure actuelle
            newDate.setHours(currentDate.getHours());
            newDate.setMinutes(currentDate.getMinutes());
            
            // Vérifier si la date est valide
            if (isNaN(newDate.getTime())) {
              throw new Error("Date invalide après mise à jour");
            }
            
            return { pickupDateTime: newDate };
          } catch (error) {
            console.error("[Store] Erreur lors de la mise à jour de la date:", error);
            return state; // Conserver l'état actuel en cas d'erreur
          }
        }),
    }),
    {
      name: 'reservation-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ...state,
        // Convertir la date en ISO string pour le stockage
        pickupDateTime: state.pickupDateTime.toISOString(),
      }),
      onRehydrateStorage: () => (state) => {
        // Reconvertir la date en objet Date lors de la réhydratation
        if (state && typeof state.pickupDateTime === 'string') {
          try {
            state.pickupDateTime = new Date(state.pickupDateTime);
          } catch (error) {
            console.error("[Store] Erreur lors de la réhydratation de la date:", error);
            state.pickupDateTime = new Date(); // Utiliser la date actuelle en cas d'erreur
          }
        }
      },
    }
  )
);
