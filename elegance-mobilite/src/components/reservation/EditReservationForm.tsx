"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { AutocompleteInput } from "@/components/AutocompleteInput";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { useReservationStore } from "@/lib/stores/reservationStore";
import EditReservationMap from "@/components/map/EditReservationMap";
import { PriceSummary } from "@/components/reservation/PriceSummary";
import { Database } from "@/lib/types/database.types";

interface EditReservationFormProps {
  initialData: Database["public"]["Tables"]["rides"]["Row"];
  onSubmit: (formData: any) => void;
  onCancel: () => void;
}

const EditReservationForm: React.FC<EditReservationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const store = useReservationStore();
  const initialized = useRef(false);

  // Pré-remplir le store à l'ouverture
  useEffect(() => {
    if (!initialized.current && initialData) {
      store.setDeparture({
        lat: initialData.pickup_lat || 0,
        lon: initialData.pickup_lon || 0,
        display_name: initialData.pickup_address,
        address: { formatted: initialData.pickup_address }
      });
      store.setDestination({
        lat: initialData.dropoff_lat || 0,
        lon: initialData.dropoff_lon || 0,
        display_name: initialData.dropoff_address,
        address: { formatted: initialData.dropoff_address }
      });
      store.setPickupDateTime(new Date(initialData.pickup_time));
      store.setSelectedVehicle(initialData.vehicle_type || "STANDARD");
      if (initialData.options) {
        store.setSelectedOptions(initialData.options);
      }
      if (typeof initialData.distance === "number") {
        store.setDistance(initialData.distance);
      }
      if (typeof initialData.duration === "number") {
        store.setDuration(initialData.duration);
      }
      initialized.current = true;
    }
  }, [initialData, store]);

  // Callbacks pour les champs
  const handleOriginSelect = (lat: number, lon: number, address: string) => {
    store.setDeparture({
      lat,
      lon,
      display_name: address,
      address: { formatted: address }
    });
  };

  const handleDestinationSelect = (lat: number, lon: number, address: string) => {
    store.setDestination({
      lat,
      lon,
      display_name: address,
      address: { formatted: address }
    });
  };

  const handleDateChange = (date: Date | null) => {
    if (date) store.setPickupDateTime(date);
  };

  const handleVehicleChange = (value: string) => {
    store.setSelectedVehicle(value);
  };

  const handleOptionToggle = (option: string) => {
    store.toggleOption(option);
  };

  // Soumission
  const handleSubmit = async () => {
    const formData = {
      pickup_address: store.departure?.display_name,
      pickup_lat: store.departure?.lat,
      pickup_lon: store.departure?.lon,
      dropoff_address: store.destination?.display_name,
      dropoff_lat: store.destination?.lat,
      dropoff_lon: store.destination?.lon,
      pickup_time: store.pickupDateTime?.toISOString(),
      vehicle_type: store.selectedVehicle,
      options: store.selectedOptions,
      distance: store.distance,
      duration: store.duration,
      // Le prix estimé sera recalculé côté serveur à la validation finale
    };
    await onSubmit(formData);
  };

  return (
    <div className="bg-neutral-900/50 backdrop-blur-lg rounded-lg border border-neutral-800 p-8 max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">Modifier la réservation</h2>
      <div className="space-y-6">
        <div>
          <Label>Adresse de départ</Label>
          <AutocompleteInput
            id="pickup-location"
            value={store.departure?.display_name || ""}
            onSelect={handleOriginSelect}
            placeholder="Adresse de départ"
          />
        </div>
        <div>
          <Label>Adresse d'arrivée</Label>
          <AutocompleteInput
            id="dropoff-location"
            value={store.destination?.display_name || ""}
            onSelect={handleDestinationSelect}
            placeholder="Adresse d'arrivée"
          />
        </div>
        <div>
          <Label htmlFor="pickup-datetime">Date et heure de prise en charge</Label>
          <DateTimePicker
            value={store.pickupDateTime || new Date()}
            onChange={handleDateChange}
            label="Date et heure de prise en charge"
            minDate={new Date()}
          />
        </div>
        <div>
          <Label className="mb-4 block">Type de véhicule</Label>
          <RadioGroup
            value={store.selectedVehicle || ""}
            onValueChange={handleVehicleChange}
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="STANDARD" id="standard" />
              <Label htmlFor="standard">Berline Premium</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="VAN" id="van" />
              <Label htmlFor="van">Van de Luxe</Label>
            </div>
          </RadioGroup>
        </div>
        <div>
          <Label className="mb-4 block">Options</Label>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="accueil"
                checked={store.selectedOptions.includes("accueil")}
                onCheckedChange={() => handleOptionToggle("accueil")}
              />
              <Label htmlFor="accueil">Accueil personnalisé</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="boissons"
                checked={store.selectedOptions.includes("boissons")}
                onCheckedChange={() => handleOptionToggle("boissons")}
              />
              <Label htmlFor="boissons">Boissons fraîches</Label>
            </div>
          </div>
        </div>
        <EditReservationMap />
        <PriceSummary />
        <div className="flex gap-4 pt-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Annuler
          </Button>
          <Button onClick={handleSubmit} className="flex-1 btn-gradient"
            disabled={
              !store.departure ||
              !store.destination ||
              !store.pickupDateTime ||
              !store.selectedVehicle
            }
          >
            Enregistrer les modifications
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditReservationForm;
