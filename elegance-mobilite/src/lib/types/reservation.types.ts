export interface Location {
  lat: number;
  lon: number;
  display_name: string;
  address: Record<string, any>;
}

export interface ReservationState {
  departure: Location | null;
  destination: Location | null;
  pickupDateTime: Date;
  distance: number | null;
  duration: number | null;
  selectedVehicle: string;
  selectedOptions: string[];
  step: number;
}

export interface ReservationActions {
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

export type ReservationStore = ReservationState & ReservationActions;
