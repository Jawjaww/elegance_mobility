"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import DateTimePicker from '@/components/ui/date-time-picker';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { pricingService } from '@/lib/services/pricingService';
import { formatCurrency } from '@/lib/utils';
import { Calendar, Car, Route, MapPin } from 'lucide-react';
import LocationStep from '@/components/reservation/LocationStep';
import VehicleStep from '@/components/reservation/VehicleStep';
import { Coordinates } from '@/lib/types/map-types';
import { useToast } from '@/hooks/useToast';
import { VehicleType, VehicleOptions } from '@/lib/types/vehicle.types';
import { dbVehicleTypeToEnum, dbOptionsToVehicleOptions, vehicleOptionsToDbOptions } from '@/lib/utils/db-mapping';

// Type pour initialData
interface ReservationData {
  id: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lon: number;
  dropoff_address: string;
  dropoff_lat: number;
  dropoff_lon: number;
  pickup_time: string;
  vehicle_type: string;
  options?: string[];
  distance: number;
  duration: number;
  estimated_price: number;
  status: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface EditReservationFormProps {
  initialData: ReservationData;
  onSubmit: (formData: any) => void;
  onCancel: () => void;
  showCard?: boolean;
}

const EditReservationForm: React.FC<EditReservationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  showCard = true
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [origin, setOrigin] = useState<Coordinates | undefined>(() => ({
    lat: initialData.pickup_lat || 48.8566,
    lon: initialData.pickup_lon || 2.3522
  }));
  const [destination, setDestination] = useState<Coordinates | undefined>(() => ({
    lat: initialData.dropoff_lat || 48.8566,
    lon: initialData.dropoff_lon || 2.3522
  }));
  const [originAddress, setOriginAddress] = useState(initialData.pickup_address || '');
  const [destinationAddress, setDestinationAddress] = useState(initialData.dropoff_address || '');
  const [pickupDateTime, setPickupDateTime] = useState<Date>(() => {
    try {
      const date = new Date(initialData.pickup_time);
      return isNaN(date.getTime()) ? new Date() : date;
    } catch (e) {
      console.warn("Date invalide fournie:", initialData.pickup_time);
      return new Date();
    }
  });
  const [distance, setDistance] = useState(initialData.distance || 0);
  const [duration, setDuration] = useState(initialData.duration || 0);
  const [vehicleType, setVehicleType] = useState<VehicleType>(() => dbVehicleTypeToEnum(initialData.vehicle_type));
  const [options, setOptions] = useState<VehicleOptions>(() => {
    const dbOptions = dbOptionsToVehicleOptions(initialData.options || []);
    return {
      childSeat: dbOptions.childSeat || false,
      petFriendly: dbOptions.petFriendly || false
    };
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isPriceLoading, setIsPriceLoading] = useState(false);
  const [price, setPrice] = useState({
    basePrice: 0,
    optionsPrice: 0,
    totalPrice: initialData.estimated_price || 0
  });

  useEffect(() => {
    const calculatePrice = async () => {
      try {
        setIsPriceLoading(true);
        await pricingService.initialize();
        const selectedOptions = Object.entries(options)
          .filter(([_, value]) => value)
          .map(([key]) => key);
        const priceData = await pricingService.calculatePrice(
          distance,
          vehicleType,
          selectedOptions
        );
        setPrice(priceData);
      } catch (error) {
        console.error("Erreur lors du calcul du prix:", error);
        setPrice({
          basePrice: initialData.estimated_price || 0,
          optionsPrice: 0,
          totalPrice: initialData.estimated_price || 0
        });
      } finally {
        setIsPriceLoading(false);
      }
    };
    calculatePrice();
  }, [vehicleType, options, distance, initialData.estimated_price]);

  const handleNextStep = () => {
    if (!origin || !destination || !originAddress || !destinationAddress) {
      toast({
        title: "Informations manquantes",
        description: "Veuillez renseigner l'adresse de départ et de destination",
        variant: "destructive"
      });
      return;
    }
    setStep(2);
  };

  const handlePrevStep = () => setStep(1);

  const handleOriginSelect = (address: string, coords: Coordinates) => {
    console.log("Origine sélectionnée:", address, coords);
    setOrigin(coords);
    setOriginAddress(address);
  };

  const handleDestinationSelect = (address: string, coords: Coordinates) => {
    console.log("Destination sélectionnée:", address, coords);
    setDestination(coords);
    setDestinationAddress(address);
  };

  const handleLocationDetected = (coords: Coordinates) => {
    console.log("Position détectée:", coords);
    setOrigin(coords);
    setOriginAddress("Ma position actuelle");
  };

  const handleRouteCalculated = (newDistance: number, newDuration: number) => {
    console.log("Route calculée:", newDistance, newDuration);
    setDistance(Math.round(newDistance / 1000));
    setDuration(Math.round(newDuration / 60));
  };

  const handleOptionChange = (option: keyof VehicleOptions) => {
    setOptions({
      ...options,
      [option]: !options[option]
    });
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const optionsForDb: Record<string, boolean> = {
        childSeat: options.childSeat,
        petFriendly: options.petFriendly
      };
      const selectedOptions = vehicleOptionsToDbOptions(optionsForDb);
      const formData = {
        pickupAddress: originAddress,
        pickupLat: origin?.lat || initialData.pickup_lat,
        pickupLon: origin?.lon || initialData.pickup_lon,
        dropoffAddress: destinationAddress,
        dropoffLat: destination?.lat || initialData.dropoff_lat,
        dropoffLon: destination?.lon || initialData.dropoff_lon,
        pickupDateTime: pickupDateTime.toISOString(),
        vehicleType: vehicleType.toString(),
        selectedOptions: selectedOptions,
        distance: distance,
        duration: duration,
        estimated_price: price.totalPrice // Ajout du prix estimé
      };
      await onSubmit(formData);
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      toast({
        title: "Erreur",
        description: "Un problème est survenu lors de la mise à jour de votre réservation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={showCard ? "bg-neutral-900/50 backdrop-blur-lg rounded-lg border border-neutral-800 p-8" : ""}>
      {step === 1 ? (
        <LocationStep 
          onNextStep={handleNextStep}
          onRouteCalculated={handleRouteCalculated}
          onOriginSelect={handleOriginSelect}
          onDestinationSelect={handleDestinationSelect}
          originAddress={originAddress}
          destinationAddress={destinationAddress}
          isEditing={true}
        />
      ) : (
        <VehicleStep
          vehicleType={vehicleType}
          options={options}
          distance={distance}
          duration={duration}
          onVehicleTypeChange={setVehicleType}
          onOptionsChange={setOptions}
          onPrevious={handlePrevStep}
          onConfirm={handleSubmit}
        />
      )}
    </div>
  );
};

export default EditReservationForm;
