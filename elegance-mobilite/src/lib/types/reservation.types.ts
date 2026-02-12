export interface Location {
  lat: number;
  lon: number;
  display_name: string;
  address: Record<string, any>;
}

import type { VehicleType } from '@/lib/vehicle';

export interface ReservationState {
  departure: Location | null;
  destination: Location | null;
  pickupDateTime: Date;
  distance: number | null;
  duration: number | null;
  selectedVehicle: VehicleType;
  selectedOptions: string[];
  step: number;
}

export interface ReservationActions {
  setDeparture: (location: any) => void;
  setDestination: (location: any) => void;
  setPickupDateTime: (date: Date) => void;
  setDistance: (distance: number) => void;
  setDuration: (duration: number) => void;
  setSelectedVehicle: (vehicle: VehicleType) => void;
  toggleOption: (option: string) => void;
  setSelectedOptions: (options: string[]) => void;
  setStep: (step: number) => void;
  reset: () => void;
  addMinutesToPickupTime: (minutes: number) => void;
  updatePickupDate: (date: Date) => void;
}

export type ReservationStore = ReservationState & ReservationActions;
