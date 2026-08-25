"use client";

import { Card } from "@/components/ui/card";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import RideRequestMap from "@/components/map/RideRequestMap";
import { AutocompleteInput } from "../AutocompleteInput";
import { LoadingSpinner } from "../ui/loading-spinner";
import React, { Suspense, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { validateVehicleType } from "@/lib/utils/vehicle";
import { Database } from "@/lib/types/database.types";
import { supabase } from "@/lib/database/client";

export interface ReservationFormProps {
  editMode?: boolean;
  reservationId?: string | null;
  initialData?: Database["public"]["Tables"]["rides"]["Row"];
  onSuccess?: () => void;
  onCancel?: () => void;
}

type LocLike = {
  lat: number;
  lon: number;
  display_name: string;
  address: { formatted: string };
} | null;

function isValidLoc(loc: {
  lat?: number | null;
  lon?: number | null;
} | null): boolean {
  return (
    loc != null &&
    typeof loc.lat === "number" &&
    typeof loc.lon === "number" &&
    Number.isFinite(loc.lat) &&
    Number.isFinite(loc.lon)
  );
}

function resolveEndpoint(
  storeLoc: {
    lat?: number | null;
    lon?: number | null;
    display_name?: string;
  } | null,
  initialLat: number | null | undefined,
  initialLon: number | null | undefined,
  initialAddress: string | undefined,
): LocLike {
  if (isValidLoc(storeLoc)) {
    return {
      lat: storeLoc!.lat!,
      lon: storeLoc!.lon!,
      display_name: storeLoc!.display_name || "",
      address: { formatted: storeLoc!.display_name || "" },
    };
  }
  if (typeof initialLat === "number" && typeof initialLon === "number") {
    return {
      lat: initialLat,
      lon: initialLon,
      display_name: initialAddress || "",
      address: { formatted: initialAddress || "" },
    };
  }
  return null;
}

export const ReservationForm: React.FC<ReservationFormProps> = ({
  editMode = false,
  reservationId,
  initialData,
  onSuccess,
  onCancel,
}) => {
  const router = useRouter();
  const store = useReservationStore();
  const [mapKey, setMapKey] = useState(`map-${Date.now()}`);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (initialData && !renderedRef.current) {
      store.setDeparture({
        lat: initialData.pickup_lat || 0,
        lon: initialData.pickup_lon || 0,
        display_name: initialData.pickup_address,
        address: { formatted: initialData.pickup_address },
      });

      store.setDestination({
        lat: initialData.dropoff_lat || 0,
        lon: initialData.dropoff_lon || 0,
        display_name: initialData.dropoff_address,
        address: { formatted: initialData.dropoff_address },
      });

      store.setPickupDateTime(new Date(initialData.pickup_time));
      const vt = initialData.vehicle_type as unknown;
      const validated = validateVehicleType(vt);
      store.setSelectedVehicle(validated as any);

      if (initialData.options) {
        initialData.options.forEach((option) => {
          if (!store.selectedOptions.includes(option)) {
            store.toggleOption(option);
          }
        });
      }

      renderedRef.current = true;
      setMapKey(`map-edit-${Date.now()}`);
    }
  }, [initialData, store]);

  const handleCreateNext = () => {
    router.push("/reservation/confirmation");
  };

  const handleEditSave = async () => {
    if (!reservationId) return;
    try {
      const updateData = {
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
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("rides")
        .update(updateData)
        .eq("id", reservationId);

      if (error) throw error;
      onSuccess?.();
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  const handleReset = () => {
    store.reset();
    onCancel?.();
  };

  const handleDateChange = (date: Date | null) => {
    if (date) {
      store.setPickupDateTime(date);
    }
  };

  const handleOriginSelect = (lat: number, lon: number, address: string) => {
    store.setDeparture({
      lat,
      lon,
      display_name: address,
      address: { formatted: address },
    });
  };

  const handleDestinationSelect = (
    lat: number,
    lon: number,
    address: string,
  ) => {
    store.setDestination({
      lat,
      lon,
      display_name: address,
      address: { formatted: address },
    });
  };

  const handleRouteCalculated = (distance: number, duration: number) => {
    if (
      store.distance !== Math.round(distance / 1000) ||
      store.duration !== Math.round(duration / 60)
    ) {
      store.setDistance(Math.round(distance / 1000));
      store.setDuration(Math.round(duration / 60));
    }
  };

  const effectiveDeparture = resolveEndpoint(
    store.departure,
    initialData?.pickup_lat,
    initialData?.pickup_lon,
    initialData?.pickup_address,
  );
  const effectiveDestination = resolveEndpoint(
    store.destination,
    initialData?.dropoff_lat,
    initialData?.dropoff_lon,
    initialData?.dropoff_address,
  );

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-8 max-w-4xl mx-auto">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Détails du trajet</h2>

          <div className="space-y-6">
            <div>
              <Label>Point de départ</Label>
              <AutocompleteInput
                id="pickup-location"
                value={store.departure?.display_name || ""}
                onSelect={handleOriginSelect}
                placeholder="Adresse de départ"
              />
            </div>

            <div>
              <Label>Destination</Label>
              <AutocompleteInput
                id="dropoff-location"
                value={store.destination?.display_name || ""}
                onSelect={handleDestinationSelect}
                placeholder="Adresse d'arrivée"
              />
            </div>

            <div className="mt-6">
              <Label className="mb-4 block">Type de véhicule</Label>
              <RadioGroup
                value={store.selectedVehicle || ""}
                onValueChange={(value) => {
                  store.setSelectedVehicle(validateVehicleType(value) as any);
                }}
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
                    onCheckedChange={() => {
                      store.toggleOption("accueil");
                    }}
                  />
                  <Label htmlFor="accueil">Accueil personnalisé</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="boissons"
                    checked={store.selectedOptions.includes("boissons")}
                    onCheckedChange={() => {
                      store.toggleOption("boissons");
                    }}
                  />
                  <Label htmlFor="boissons">Boissons fraîches</Label>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {effectiveDeparture && effectiveDestination ? (
          <Suspense
            fallback={
              <Card className="p-6">
                <LoadingSpinner />
              </Card>
            }
          >
            <Card className="p-0 overflow-hidden">
              <RideRequestMap
                key={mapKey}
                departure={effectiveDeparture}
                destination={effectiveDestination}
                onRouteCalculated={handleRouteCalculated}
              />
            </Card>
          </Suspense>
        ) : null}

        <Card className="p-6">
          <Label htmlFor="pickup-datetime">
            Date et heure de prise en charge
          </Label>
          <div className="mt-2">
            <DateTimePicker
              value={store.pickupDateTime || new Date()}
              onChange={handleDateChange}
              label="Date et heure de prise en charge"
              minDate={new Date()}
            />
          </div>
        </Card>

        <div className="flex gap-4">
          <Button variant="outline" onClick={handleReset} className="flex-1">
            {editMode ? "Retour" : "Annuler"}
          </Button>
          <Button
            onClick={editMode ? handleEditSave : handleCreateNext}
            className="flex-1 btn-gradient"
            disabled={
              !store.departure ||
              !store.destination ||
              !store.pickupDateTime ||
              !store.selectedVehicle
            }
          >
            {editMode ? "Enregistrer les modifications" : "Continuer"}
          </Button>
        </div>
      </div>
    </div>
  );
};
