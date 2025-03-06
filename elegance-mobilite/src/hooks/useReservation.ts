"use client";

import { useState, useCallback } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from 'next/navigation';
import { Coordinates, VehicleType, VehicleOptions } from '../lib/types';
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
  const [origin, setOrigin] = useState<Coordinates | undefined>(reservationStore.departure ? { lat: reservationStore.departure.lat, lng: reservationStore.departure.lon } : undefined);
  const [destination, setDestination] = useState<Coordinates | undefined>(reservationStore.destination ? { lat: reservationStore.destination.lat, lng: reservationStore.destination.lon } : undefined);
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
    }), { childSeat: false, pets: false } as VehicleOptions)
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
      // Update store with all information
      reservationStore.setDeparture({
        lat: origin.lat,
        lon: origin.lng,
        display_name: originAddress,
        address: {}
      });
      reservationStore.setDestination({
        lat: destination.lat,
        lon: destination.lng,
        display_name: destinationAddress,
        address: {}
      });
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

      // Use Next.js router for navigation
      router.push('/reservation/confirmation');
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

  const handleOriginSelect = useCallback((address: string, coords: Coordinates) => {
    if (address === '') {
      setOrigin(undefined);
      setOriginAddress('');
      setPickup(DEFAULT_LOCATION_STATE);
    } else {
      setOrigin(coords);
      setOriginAddress(address);
      setPickup({
        raw: address,
        validated: { location: coords }
      });
    }
  }, []);

  const handleDestinationSelect = useCallback((address: string, coords: Coordinates) => {
    if (address === '') {
      setDestination(undefined);
      setDestinationAddress('');
      setDropoff(DEFAULT_LOCATION_STATE);
    } else {
      setDestination(coords);
      setDestinationAddress(address);
      setDropoff({
        raw: address,
        validated: { location: coords }
      });
    }
  }, []);

  const handleRouteCalculated = useCallback((newDistance: number, newDuration: number) => {
    // Convert distance from meters to kilometers
    setDistance(Math.round(newDistance / 1000));
    // Duration is in seconds, convert to minutes
    setDuration(Math.round(newDuration / 60));
  }, []);

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