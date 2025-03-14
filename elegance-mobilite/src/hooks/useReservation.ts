"use client";

import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { Coordinates } from '../lib/types/map-types';
import { VehicleType, VehicleOptions } from '../lib/types/vehicle.types';
import { useReservationStore } from '../lib/stores/reservationStore';

interface LocationState {
  raw: string;
  validated: { location: Coordinates } | null;
}

const DEFAULT_LOCATION_STATE: LocationState = {
  raw: "",
  validated: null
};

export function useReservation() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const reservationStore = useReservationStore();
  
  // Standardisation sur lon et gestion des cas null
  const [origin, setOrigin] = useState<Coordinates | undefined>(() => {
    if (!reservationStore.departure) return undefined;
    return { 
      lat: reservationStore.departure.lat, 
      lon: reservationStore.departure.lon 
    };
  });
  
  const [destination, setDestination] = useState<Coordinates | undefined>(() => {
    if (!reservationStore.destination || !reservationStore.departure) return undefined;
    return { 
      lat: reservationStore.destination.lat, 
      lon: reservationStore.destination.lon 
    };
  });
  
  // Reste du code inchangé
  const [originAddress, setOriginAddress] = useState(reservationStore.departure?.display_name || "");
  const [destinationAddress, setDestinationAddress] = useState(reservationStore.destination?.display_name || "");
  const [pickupDateTime, setPickupDateTime] = useState(() => {
    return reservationStore.pickupDateTime || new Date();
  });
  const [distance, setDistance] = useState(reservationStore.distance || 0);
  const [duration, setDuration] = useState(reservationStore.duration || 0);
  const [vehicleType, setVehicleType] = useState<VehicleType>((reservationStore.selectedVehicle as VehicleType) || 'STANDARD');
  const [pickup, setPickup] = useState<LocationState>(DEFAULT_LOCATION_STATE);
  const [dropoff, setDropoff] = useState<LocationState>(DEFAULT_LOCATION_STATE);
  const [options, setOptions] = useState<VehicleOptions>(() => 
    reservationStore.selectedOptions.reduce((acc, option) => ({ 
      ...acc, [option]: true 
    }), { childSeat: false, petFriendly: false } as VehicleOptions)
  );

  const handleNextStep = useCallback(() => {
    if (!origin || !destination || !originAddress || !destinationAddress) {
      toast({
        title: 'Error',
        variant: 'destructive'
      });
      return;
    }
    
    if (typeof originAddress !== 'string' || typeof destinationAddress !== 'string') {
      toast({
        title: 'Error',
        variant: 'destructive'
      });
      return;
    }
    
    setStep(prev => Math.min(prev + 1, 2));
  }, [origin, destination, originAddress, destinationAddress, toast]);

  const router = useRouter();

  // Utilisation cohérente de lon
  const handleReservation = useCallback(() => {
    console.log("handleReservation called");
    if (!origin || !destination) {
      toast({
        title: 'Please select a departure and destination point',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Update store with all information with lon
      if (origin && destination) {
        reservationStore.setDeparture({
          lat: origin.lat,
          lon: origin.lon,
          display_name: originAddress,
          address: {}
        });
        
        reservationStore.setDestination({
          lat: destination.lat,
          lon: destination.lon,
          display_name: destinationAddress,
          address: {}
        });
      }
      reservationStore.setSelectedVehicle(vehicleType);
      reservationStore.setDistance(distance);
      reservationStore.setDuration(duration);
      reservationStore.setPickupDateTime(pickupDateTime);
      
      // Set all selected options at once
      const selectedOptions = Object.entries(options)
        .filter(([, value]) => value)
        .map(([key]) => key);
      
      // Contournement: utiliser toggleOption au lieu de setSelectedOptions
      // D'abord retirer toutes les options
      [...reservationStore.selectedOptions].forEach(option => {
        reservationStore.toggleOption(option);
      });
      
      // Ajouter les nouvelles options
      selectedOptions.forEach(option => {
        if (!reservationStore.selectedOptions.includes(option)) {
          reservationStore.toggleOption(option);
        }
      });

      // Vérifier si nous sommes en mode édition
      const editingId = localStorage.getItem('currentEditingReservationId');
      const urlParams = editingId ? `?edit=true&id=${editingId}` : '';

      // Use Next.js router for navigation - toujours rediriger vers la page de confirmation
      router.push(`/reservation/confirmation${urlParams}`);
    } catch (error) {
      console.error('Error saving reservation:', error);
      toast({
        title: 'An error occurred while saving the reservation',
        variant: 'destructive'
      });
    }
  }, [origin, destination, originAddress, destinationAddress, vehicleType, options, distance, duration, pickupDateTime, router, reservationStore, toast]);

  const handlePrevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleLocationDetected = useCallback((coords: Coordinates) => {
    setOrigin(coords);
    setOriginAddress("My current location");
    setPickup({
      raw: "My current location",
      validated: { location: coords }
    });
  }, []);

  // Mise à jour des gestionnaires pour utiliser lon et gérer les valeurs nulles
  const handleOriginSelect = useCallback((address: string, coords: Coordinates) => {
    if (!address || address.trim() === '') {
      setOrigin(undefined);
      setOriginAddress('');
      setPickup(DEFAULT_LOCATION_STATE);
      // Réinitialiser le store avec null explicitement
      reservationStore.setDeparture(null);
      // Réinitialiser la distance et la durée car l'itinéraire n'est plus valide
      setDistance(0);
      setDuration(0);
      reservationStore.setDistance(0);
      reservationStore.setDuration(0);
    } else {
      setOrigin(coords);
      setOriginAddress(address);
      setPickup({
        raw: address,
        validated: { location: coords }
      });
      // Mettre à jour le store avec un objet Location valide
      reservationStore.setDeparture({
        lat: coords.lat,
        lon: coords.lon,
        display_name: address,
        address: {}
      });
    }
  }, [reservationStore]);

  const handleDestinationSelect = useCallback((address: string, coords: Coordinates) => {
    if (!address || address.trim() === '') {
      setDestination(undefined);
      setDestinationAddress('');
      setDropoff(DEFAULT_LOCATION_STATE);
      // Réinitialiser le store avec null explicitement
      reservationStore.setDestination(null);
      // Réinitialiser la distance et la durée car l'itinéraire n'est plus valide
      setDistance(0);
      setDuration(0);
      reservationStore.setDistance(0);
      reservationStore.setDuration(0);
    } else {
      setDestination(coords);
      setDestinationAddress(address);
      setDropoff({
        raw: address,
        validated: { location: coords }
      });
      // Mettre à jour le store avec un objet Location valide
      reservationStore.setDestination({
        lat: coords.lat,
        lon: coords.lon,
        display_name: address,
        address: {}
      });
    }
  }, [reservationStore]);

  const handleRouteCalculated = useCallback((newDistance: number, newDuration: number) => {
    // Convert distance from meters to kilometers
    const distanceKm = Math.round(newDistance / 1000);
    // Duration is in seconds, convert to minutes
    const durationMin = Math.round(newDuration / 60);
    
    // Mettre à jour l'état local
    setDistance(distanceKm);
    setDuration(durationMin);
    
    // Mettre à jour le store
    reservationStore.setDistance(distanceKm);
    reservationStore.setDuration(durationMin);
  }, [reservationStore]);

  const handleOptionsChange = useCallback((newOptions: VehicleOptions) => {
    setOptions(newOptions);
  }, []);

  return {
    step,
    origin,
    destination,
    originAddress,
    destinationAddress,
    pickupDateTime,
    distance,
    duration,
    vehicleType,
    options,
    pickup,
    dropoff,
    handleNextStep,
    handlePrevStep,
    handleReservation,
    handleOriginSelect,
    handleDestinationSelect,
    handleLocationDetected,
    handleRouteCalculated,
    setPickupDateTime,
    setOriginAddress,
    setDestinationAddress,
    setVehicleType,
    setOptions: handleOptionsChange
  };
}
