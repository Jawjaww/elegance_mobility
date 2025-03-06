interface ReservationState {
  selectedOptions: string[];
  setSelectedOptions: (options: string[]) => void;
}

export const useReservationStore = create<ReservationState>((set) => ({
  selectedOptions: [],
  setSelectedOptions: (options: string[]) => set({ selectedOptions: options }),
}));