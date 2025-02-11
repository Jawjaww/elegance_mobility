// "use client";

// import { useCallback } from "react";
// import { useAddressStore } from "@/lib/addressStore";
// import { useToast } from "@/components/ui/toast";
// import type { Coordinates } from "@/lib/types";

// export function useReservationAddress() {
//   const addressStore = useAddressStore();
//   const { toast } = useToast();

//   const handleLocationChange = useCallback((value: string, isOrigin: boolean) => {
//     if (isOrigin) {
//       addressStore.setOrigin(undefined, value);
//     } else {
//       addressStore.setDestination(undefined, value);
//     }
//   }, [addressStore]);

//   const handleLocationSelect = useCallback((
//     address: string,
//     coords: Coordinates,
//     isOrigin: boolean
//   ) => {
//     if (!address || !coords) {
//       toast({
//         title: "Erreur",
//         variant: "destructive",
//         children: "Adresse invalide"
//       });
//       return;
//     }

//     try {
//       if (isOrigin) {
//         addressStore.setOrigin(coords, address);
//       } else {
//         addressStore.setDestination(coords, address);
//       }
//     } catch (error) {
//       console.error("Erreur lors de la sélection de l'adresse:", error);
//       toast({
//         title: "Erreur",
//         variant: "destructive",
//         children: "Impossible de définir l'adresse"
//       });
//     }
//   }, [addressStore, toast]);

//   const handleRouteCalculated = useCallback((distance: number, duration: number) => {
//     if (distance <= 0 || duration <= 0) {
//       toast({
//         title: "Attention",
//         variant: "destructive",
//         children: "Le calcul de l'itinéraire a échoué"
//       });
//       return;
//     }

//     try {
//       addressStore.setRouteInfo(distance, duration);
//     } catch (error) {
//       console.error("Erreur lors du calcul de l'itinéraire:", error);
//       toast({
//         title: "Erreur",
//         variant: "destructive",
//         children: "Impossible de sauvegarder l'itinéraire"
//       });
//     }
//   }, [addressStore, toast]);

//   const validateAddresses = useCallback(() => {
//     if (!addressStore.origin || !addressStore.destination) {
//       toast({
//         title: "Erreur",
//         variant: "destructive",
//         children: "Veuillez sélectionner une origine et une destination"
//       });
//       return false;
//     }

//     if (!addressStore.originAddress || !addressStore.destinationAddress) {
//       toast({
//         title: "Erreur",
//         variant: "destructive",
//         children: "Les adresses sont invalides"
//       });
//       return false;
//     }

//     return true;
//   }, [addressStore, toast]);

//   return {
//     origin: addressStore.origin,
//     destination: addressStore.destination,
//     originAddress: addressStore.originAddress,
//     destinationAddress: addressStore.destinationAddress,
//     distance: addressStore.distance,
//     duration: addressStore.duration,
//     handleLocationChange,
//     handleLocationSelect,
//     handleRouteCalculated,
//     validateAddresses,
//   };
// }