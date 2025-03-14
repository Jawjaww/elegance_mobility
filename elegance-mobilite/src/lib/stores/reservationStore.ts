import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';
import { Coordinates, Location } from '@/lib/types/map-types';

// Fonction de normalisation utilisant uniquement lon
function normalizeLocation(location: any): Location | null {
  try {
    // Cas explicite pour null ou undefined
    if (location === null || location === undefined) {
      console.log("[Store] Réinitialisation des coordonnées");
      return null;
    }

    // Vérifier le type de l'objet
    if (typeof location !== 'object') {
      console.error("[Store] Format invalide pour location:", location);
      throw new Error("Format de données incorrect");
    }

    // Validation et conversion des coordonnées
    const lat = typeof location.lat === 'number' ? location.lat : 
                typeof location.lat === 'string' ? parseFloat(location.lat) : null;
    const lon = typeof location.lon === 'number' ? location.lon : 
                typeof location.lon === 'string' ? parseFloat(location.lon) : null;

    // Vérification des valeurs
    if (lat === null || lon === null || isNaN(lat) || isNaN(lon)) {
      console.error("[Store] Coordonnées invalides:", { lat, lon });
      throw new Error("Coordonnées invalides");
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      console.error("[Store] Coordonnées hors limites:", { lat, lon });
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

interface ReservationState {
  departure: Location | null;
  destination: Location | null;
  pickupDateTime: Date;
  distance: number | null;
  duration: number | null;
  selectedVehicle: string;
  selectedOptions: string[];
  step: number;
  setDeparture: (location: any) => void;
  setDestination: (location: any) => void;
  setPickupDateTime: (date: Date) => void;
  setDistance: (distance: number) => void;
  setDuration: (duration: number) => void;
  setSelectedVehicle: (vehicle: string) => void;
  toggleOption: (option: string) => void;
  setSelectedOptions: (options: string[]) => void;
  setStep: (step: number) => void;
  reset: () => void;
  addMinutesToPickupTime: (minutes: number) => void;
  updatePickupDate: (date: Date) => void;
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

export const useReservationStore = create<ReservationState>()(
  persist(
    (set) => ({
      ...initialState,

      setDeparture: (location) => {
        const normalized = normalizeLocation(location);
        set(() => ({ departure: normalized }));
      },

      setDestination: (location) => {
        const normalized = normalizeLocation(location);
        set(() => ({ destination: normalized }));
      },

      setPickupDateTime: (date) =>
        set(() => ({
          pickupDateTime: date,
        })),

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
        set((state) => ({
          ...state,
          selectedOptions: options,
        })),

      setStep: (step) =>
        set(() => ({
          step,
        })),

      reset: () =>
        set(() => ({
          departure: null,
          destination: null,
          pickupDateTime: new Date(),
          distance: 0,
          duration: 0,
          selectedVehicle: '',
          selectedOptions: [],
          step: 1,
        })),

      addMinutesToPickupTime: (minutes: number) =>
        set((state) => ({
          pickupDateTime: new Date(state.pickupDateTime.getTime() + minutes * 60000),
        })),

      updatePickupDate: (date: Date) =>
        set((state) => {
          const newDate = new Date(date);
          newDate.setHours(state.pickupDateTime.getHours());
          newDate.setMinutes(state.pickupDateTime.getMinutes());
          return {
            pickupDateTime: newDate,
          };
        }),
    }),
    {
      name: 'reservation-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
