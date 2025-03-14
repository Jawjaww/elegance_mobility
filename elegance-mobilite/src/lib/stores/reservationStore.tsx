'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Import du type Location depuis le fichier types centralisé
import { Location } from '../../lib/types/map-types';

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
  setDeparture: (locationOrLat: Location | number | null | string, lon?: number, address?: string) => void;
  setDestination: (locationOrLat: Location | number | null | string, lon?: number, address?: string) => void;
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

      setDeparture: (locationOrLat, lon, address) => {
        // Gestion explicite du cas null ou undefined
        if (locationOrLat === null || locationOrLat === undefined) {
          set({ departure: null });
          return;
        }
        
        // Support pour l'effacement du formulaire en passant une chaîne vide
        if (typeof locationOrLat === 'string') {
          if (locationOrLat === '' || locationOrLat.trim() === '') {
            set({ departure: null });
            return;
          }
        }
        
        // Supporter à la fois un objet Location complet ou des paramètres individuels
        if (typeof locationOrLat === 'object') {
          set({ departure: locationOrLat });
        } else if (typeof locationOrLat === 'number' && typeof lon === 'number' && typeof address === 'string') {
          const locationData: Location = {
            display_name: address,
            lat: locationOrLat,
            lon: lon,
            address: { formatted: address }
          };
          set({ departure: locationData });
        } else {
          console.error("Format de données incorrect pour setDeparture");
        }
      },
      
      setDestination: (locationOrLat, lon, address) => {
        // Gestion explicite du cas null ou undefined
        if (locationOrLat === null || locationOrLat === undefined) {
          set({ destination: null });
          return;
        }
        
        // Support pour l'effacement du formulaire en passant une chaîne vide
        if (typeof locationOrLat === 'string') {
          if (locationOrLat === '' || locationOrLat.trim() === '') {
            set({ destination: null });
            return;
          }
        }
        
        // Même logique que pour setDeparture
        if (typeof locationOrLat === 'object') {
          set({ destination: locationOrLat });
        } else if (typeof locationOrLat === 'number' && typeof lon === 'number' && typeof address === 'string') {
          const locationData: Location = {
            display_name: address,
            lat: locationOrLat,
            lon: lon,
            address: { formatted: address }
          };
          set({ destination: locationData });
        } else {
          console.error("Format de données incorrect pour setDestination");
        }
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
