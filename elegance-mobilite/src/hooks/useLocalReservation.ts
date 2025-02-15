// import { useEffect } from 'react';
// import { useReservationStore } from '@/lib/stores/reservationStore';

// const STORAGE_KEY = 'reservation-form';

// export const useLocalReservation = () => {
//   const store = useReservationStore();

//   // Charger les données depuis localStorage au montage
//   useEffect(() => {
//     const savedData = localStorage.getItem(STORAGE_KEY);
//     if (savedData) {
//       try {
//         const parsed = JSON.parse(savedData);
//         // Restaurer les dates comme des objets Date
//         if (parsed.pickupDateTime) {
//           parsed.pickupDateTime = new Date(parsed.pickupDateTime);
//         }
//         // Mettre à jour le store avec les données sauvegardées
//         store.setPickup(parsed.departure);
//         store.setDropoff(parsed.destination);
//         store.setPickupDateTime(parsed.pickupDateTime);
//         store.setVehicleType(parsed.selectedVehicle);
//         store.setSelectedOptions(parsed.selectedOptions || []);
//       } catch (error) {
//         console.error('Error loading saved reservation:', error);
//       }
//     }
//   }, []);

//   // Sauvegarder dans localStorage à chaque changement
//   useEffect(() => {
//     const dataToSave = {
//       departure: store.departure,
//       destination: store.destination,
//       pickupDateTime: store.pickupDateTime?.toISOString(),
//       selectedVehicle: store.selectedVehicle,
//       selectedOptions: store.selectedOptions,
//     };
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
//   }, [
//     store.departure,
//     store.destination,
//     store.pickupDateTime,
//     store.selectedVehicle,
//     store.selectedOptions,
//   ]);

//   // Réinitialisation explicite qui efface aussi localStorage
//   const clearReservation = () => {
//     localStorage.removeItem(STORAGE_KEY);
//     store.reset();
//   };

//   return { ...store, clearReservation };
// };