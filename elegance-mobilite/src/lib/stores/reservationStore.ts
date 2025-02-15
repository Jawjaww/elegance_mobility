import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createJSONStorage } from 'zustand/middleware';

interface Location {
  lat: number;
  lon: number;
  display_name: string;
  address: {
    [key: string]: string;
  };
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
  setDeparture: (location: Location | null) => void;
  setDestination: (location: Location | null) => void;
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

      setDeparture: (location) =>
        set(() => ({
          departure: location,
        })),

      setDestination: (location) =>
        set(() => ({
          destination: location,
        })),

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
          pickupDateTime: new Date(),
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