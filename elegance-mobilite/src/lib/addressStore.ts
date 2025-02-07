import { create } from 'zustand';

interface Address {
  raw: string;
  validated?: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface AddressStore {
  pickup: Address;
  dropoff: Address;
  setPickup: (address: Address) => void;
  setDropoff: (address: Address) => void;
  loadPickupFromStorage: () => void;
}

export const useAddressStore = create<AddressStore>((set) => ({
  pickup: { raw: '' },
  dropoff: { raw: '' },
  setPickup: (address) => {
    set({ pickup: address });
    localStorage.setItem('pickupAddress', JSON.stringify(address));
  },
  setDropoff: (address) => set({ dropoff: address }),
  loadPickupFromStorage: () => {
    const storedPickup = localStorage.getItem('pickupAddress');
    set((state) => {
      if (storedPickup && !state.pickup?.raw) {
        return { pickup: JSON.parse(storedPickup) };
      }
      return {};
    });
  }
}));