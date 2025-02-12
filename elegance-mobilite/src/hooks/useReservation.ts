"use client";

import { useState, useCallback } from 'react';
import { useToast } from '../components/ui/toast';
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

const DEFAULT_OPTIONS: VehicleOptions = {
  childSeat: false,
  pets: false
};

export function useReservation() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [origin, setOrigin] = useState<Coordinates>();
  const [destination, setDestination] = useState<Coordinates>();
  const [originAddress, setOriginAddress] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [pickupDateTime, setPickupDateTime] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // Par défaut, réservation dans 30 minutes
    return now;
  });
  const [distance, setDistance] = useState(0);
  const [duration, setDuration] = useState(0);
  const [vehicleType, setVehicleType] = useState<VehicleType>('STANDARD');
  const [pickup, setPickup] = useState<LocationState>(DEFAULT_LOCATION_STATE);
  const [dropoff, setDropoff] = useState<LocationState>(DEFAULT_LOCATION_STATE);
  const [options, setOptions] = useState<VehicleOptions>(DEFAULT_OPTIONS);

  const handleNextStep = useCallback(() => {
    if (!origin || !destination || !originAddress || !destinationAddress) {
      toast({
        title: 'Erreur',
        variant: 'destructive'
      });
      return;
    }
    
    if (typeof originAddress !== 'string' || typeof destinationAddress !== 'string') {
      toast({
        title: 'Erreur',
        variant: 'destructive'
      });
      return;
    }
    
    setStep(prev => Math.min(prev + 1, 2));
  }, [origin, destination, originAddress, destinationAddress, toast]);

  const router = useRouter();
  const reservationStore = useReservationStore();

  const handleReservation = useCallback(() => {
    console.log("handleReservation called");
    if (!origin || !destination) {
      toast({
        title: 'Veuillez sélectionner un point de départ et une destination',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Mettre à jour le store avec toutes les informations
      reservationStore.setPickup({
        lat: origin.lat,
        lon: origin.lng,
        display_name: originAddress
      });
      reservationStore.setDropoff({
        lat: destination.lat,
        lon: destination.lng,
        display_name: destinationAddress
      });
      reservationStore.setVehicleType(vehicleType);
      reservationStore.setDistance(distance);
      reservationStore.setDuration(duration);
      reservationStore.setPickupDateTime(pickupDateTime);
      reservationStore.setSelectedOptions(
        Object.entries(options)
          .filter(([, value]) => value)
          .map(([key]) => key)
      );

      // Utiliser le router Next.js pour la navigation
      router.push('/reservation/confirmation');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la réservation:', error);
      toast({
        title: 'Une erreur est survenue lors de la sauvegarde de la réservation',
        variant: 'destructive'
      });
    }
  }, [origin, destination, originAddress, destinationAddress, vehicleType, options, distance, duration, pickupDateTime, router, reservationStore, toast]);

  const handlePrevStep = useCallback(() => {
    setStep(prev => Math.max(prev - 1, 1));
  }, []);

  const handleLocationDetected = useCallback((coords: Coordinates) => {
    setOrigin(coords);
    setOriginAddress("Ma position actuelle");
    setPickup({
      raw: "Ma position actuelle",
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
    // Convertir la distance de mètres en kilomètres
    setDistance(Math.round(newDistance / 1000));
    // Duration est en secondes, la convertir en minutes
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