"use client";

import { useState, useCallback } from 'react';
import { useToast } from '../components/ui/toast';
import type { Coordinates, VehicleOptions, VehicleType } from '../lib/types';

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
  airConditioning: false
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
  const [vehicleType, setVehicleType] = useState<VehicleType>("STANDARD");
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

  const handleReservation = useCallback(() => {
    if (!origin || !destination) {
      toast({
        title: 'Erreur',
        variant: 'destructive'
      });
      return;
    }

    try {
      const reservationData = {
        origin: originAddress,
        destination: destinationAddress,
        pickupDateTime: pickupDateTime.toISOString(),
        vehicleType,
        options,
        distance,
        duration,
        pickup,
        dropoff
      };

      localStorage.setItem('reservationData', JSON.stringify(reservationData));
      window.location.href = '/reservation/confirmation';
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la réservation:', error);
      toast({
        title: 'Erreur',
        variant: 'destructive'
      });
    }
  }, [origin, destination, originAddress, destinationAddress, pickupDateTime, vehicleType, options, distance, duration, pickup, dropoff, toast]);

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
    setDistance(newDistance);
    setDuration(newDuration);
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