import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Amélioration du type Location avec des valeurs par défaut
export interface Location {
  display_name: string;
  lat: number;
  lon: number;
  address?: any;
}

// Définition de l'interface du store pour TypeScript
export interface ReservationStore {
  // États
  departure: Location | null;
  destination: Location | null;
  pickupDateTime: Date;
  selectedVehicle: string | null;
  selectedOptions: string[];
  distance: number | null;
  duration: number | null;
  price: number | null;

  // Actions
  setDeparture: (location: Location | null) => void;
  setDestination: (location: Location | null) => void;
  setPickupDateTime: (date: Date) => void;
  setSelectedVehicle: (vehicle: string) => void;
  toggleOption: (option: string) => void;
  setDistance: (distance: number) => void;
  setDuration: (duration: number) => void;
  setPrice: (price: number) => void;
  reset: () => void;
}

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set, get) => ({
      departure: null,
      destination: null,
      pickupDateTime: new Date(),
      selectedVehicle: null,
      selectedOptions: [],
      distance: null,
      duration: null,
      price: null,

      setDeparture: (location: Location | null) => {
        // Vérifier et corriger les données si nécessaire
        if (location && (typeof location.lon !== 'number' || isNaN(location.lon))) {
          console.warn("Coordonnée longitude manquante, utilisation de la valeur par défaut");
          location.lon = 0; // Valeur par défaut
        }
        set({ departure: location });
      },
      
      setDestination: (location: Location | null) => {
        // Vérifier et corriger les données si nécessaire
        if (location && (typeof location.lon !== 'number' || isNaN(location.lon))) {
          console.warn("Coordonnée longitude manquante, utilisation de la valeur par défaut");
          location.lon = 0; // Valeur par défaut
        }
        set({ destination: location });
      },

      setPickupDateTime: (date: Date) => set({ pickupDateTime: date }),
      
      setSelectedVehicle: (vehicle: string) => set({ selectedVehicle: vehicle }),
      
      toggleOption: (option: string) => {
        const currentOptions = get().selectedOptions;
        const isSelected = currentOptions.includes(option);
        
        if (isSelected) {
          set({ selectedOptions: currentOptions.filter((o) => o !== option) });
        } else {
          set({ selectedOptions: [...currentOptions, option] });
        }
      },
      
      setDistance: (distance: number) => set({ distance }),
      
      setDuration: (duration: number) => set({ duration }),
      
      setPrice: (price: number) => set({ price }),
      
      reset: () => set({
        departure: null,
        destination: null,
        pickupDateTime: new Date(),
        selectedVehicle: null,
        selectedOptions: [],
        distance: null,
        duration: null,
        price: null
      })
    }),
    {
      name: 'reservation-store',
      // Optionnel: vous pouvez ajouter des options de persistance pour contrôler ce qui est stocké
      partialize: (state) => ({
        departure: state.departure,
        destination: state.destination,
        pickupDateTime: state.pickupDateTime,
        selectedVehicle: state.selectedVehicle,
        selectedOptions: state.selectedOptions
      }),
    }
  )
);

export default useReservationStore;
