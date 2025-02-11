// import { create } from 'zustand';

// interface Address {
//   raw: string;
//   validated?: {
//     location: {
//       lat: number;
//       lng: number;
//     };
//   };
// }

// interface AddressStore {
//   pickup: Address;
//   dropoff: Address;
//   setPickup: (address: Address) => void;
//   setDropoff: (address: Address) => void;
//   loadFromStorage: () => void;
//   saveToStorage: () => void;
// }

// export const useAddressStore = create<AddressStore>((set, get) => ({
//   pickup: { raw: '' },
//   dropoff: { raw: '' },

//   setPickup: (address) => {
//     set({ pickup: address });
//     const state = get();
//     localStorage.setItem('addresses', JSON.stringify({
//       pickup: address,
//       dropoff: state.dropoff
//     }));
//   },

//   setDropoff: (address) => {
//     set({ dropoff: address });
//     const state = get();
//     localStorage.setItem('addresses', JSON.stringify({
//       pickup: state.pickup,
//       dropoff: address
//     }));
//   },

//   loadFromStorage: () => {
//     const stored = localStorage.getItem('addresses');
//     if (stored) {
//       const { pickup, dropoff } = JSON.parse(stored);
//       set({ 
//         pickup: pickup || { raw: '' },
//         dropoff: dropoff || { raw: '' }
//       });
//     }
//   },

//   saveToStorage: () => {
//     const state = get();
//     localStorage.setItem('addresses', JSON.stringify({
//       pickup: state.pickup,
//       dropoff: state.dropoff
//     }));
//   }
// }));