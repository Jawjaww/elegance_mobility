"use client";

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { formatDuration } from "@/lib/utils";
import { CalendarIcon, Clock, MapPinIcon, CarIcon, PackageCheck, ArrowRight, Route } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useReservationStore } from "@/lib/stores/reservationStore";
import { reservationService } from "@/lib/services/reservationService";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import MapLibreMap from "@/components/map/MapLibreMap";
import { pricingService } from "@/lib/services/pricingService";
import { supabase } from "@/lib/database/client";

type EditConfirmationDetailsProps = {
  reservationId: string;
};

const SimpleSeparator = ({ className }: { className?: string }) => (
  <div className={`h-[1px] w-full bg-neutral-800 my-2 ${className || ''}`} />
);

export function EditConfirmationDetails({ reservationId }: EditConfirmationDetailsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [priceDetails, setPriceDetails] = useState<{
    basePrice: number;
    optionsPrice: number;
    totalPrice: number;
  } | null>(null);

  const {
    departure,
    destination,
    pickupDateTime,
    selectedVehicle,
    selectedOptions,
    distance,
    duration,
  } = useReservationStore();

  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  useEffect(() => {
    if (pickupDateTime) {
      try {
        const dateObj = pickupDateTime instanceof Date ? pickupDateTime : new Date(pickupDateTime);
        setFormattedDate(format(dateObj, "EEEE d MMMM yyyy", { locale: fr }));
        setFormattedTime(format(dateObj, "HH:mm", { locale: fr }));
      } catch (error) {
        setFormattedDate("Date non valide");
        setFormattedTime("");
      }
    }
  }, [pickupDateTime]);

  const handleConfirm = async () => {
    if (!departure || !destination || !pickupDateTime || !selectedVehicle) {
      toast({
        title: "Erreur",
        description: "Informations de réservation incomplètes",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const dateObj = pickupDateTime instanceof Date ? pickupDateTime : new Date(pickupDateTime);

      const updateData = {
        pickup_address: departure.display_name,
        pickup_lat: departure.lat,
        pickup_lon: departure.lon,
        dropoff_address: destination.display_name,
        dropoff_lat: destination.lat,
        dropoff_lon: destination.lon,
        pickup_time: dateObj.toISOString(),
        vehicle_type: selectedVehicle,
        options: Array.isArray(selectedOptions) ? selectedOptions : [],
        distance: distance || null,
        duration: duration || null,
        estimated_price: priceDetails?.totalPrice || null,
      };

      // 1. D'abord mettre à jour la réservation dans la base
      const { success, error } = await reservationService.updateReservation(reservationId, updateData);

      if (!success) {
        throw error || new Error("Erreur lors de la mise à jour");
      }

      // 2. ENSUITE, déclencher manuellement l'Edge Function pour calculer le prix final
      console.log("[DEBUG] Déclenchement manuel de l'Edge Function price-calculator-with-osm");
      
      // Récupérer la session pour avoir le JWT
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data: edgeFunctionData, error: edgeFunctionError } = await supabase.functions.invoke(
        'price-calculator',
        {
          body: {
            new: {
              id: reservationId,
              vehicle_type: selectedVehicle,
              pickup_lat: departure.lat,
              pickup_lon: departure.lon,
              dropoff_lat: destination.lat, 
              dropoff_lon: destination.lon,
              options: selectedOptions,
              distance: distance || null,
              duration: duration || null
            }
          },
          headers: session ? {
            Authorization: `Bearer ${session.access_token}`
          } : undefined
        }
      );

      if (edgeFunctionError) {
        console.error("Erreur lors du calcul du tarif final:", edgeFunctionError);
        // On ne fait pas échouer la mise à jour si le calcul du tarif échoue
        // La réservation est quand même enregistrée
      } else {
        console.log("Tarif final calculé avec succès:", edgeFunctionData);
      }

      toast({
        title: "✨ Modification enregistrée",
        description: `Les modifications de votre trajet ont été enregistrées.`,
        variant: "success"
      });

      setTimeout(() => {
        router.push("/my-account/reservations");
      }, 1500);

    } catch (error: any) {
      toast({
        title: "Erreur lors de la modification",
        description: error.message || "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModify = () => {
    router.back();
  };

  useEffect(() => {
    const calculatePrice = async () => {
      if (departure && destination && selectedVehicle && distance) {
        try {
          // Utiliser uniquement le pricingService local pour l'estimation
          const result = await pricingService.calculatePrice(
            distance,
            selectedVehicle,
            selectedOptions || [],
          );
          setPriceDetails(result);
        } catch (error) {
          console.error("Erreur lors du calcul du prix:", error);
        }
      }
    };
    calculatePrice();
  }, [departure, destination, selectedVehicle, selectedOptions, distance]);

  if (!departure || !destination || !pickupDateTime || !selectedVehicle) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
        );
  }

      return (
    <div className="container mx-auto py-6 md:py-8 mb-20 px-4 md:px-6">
      <div className="mb-6 md:mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-elegant-gradient bg-clip-text text-transparent">
          Confirmation des modifications
        </h1>
        <p className="text-neutral-400">Vérifiez les changements avant de valider</p>
      </div>
      <div className="grid gap-6 md:gap-8 max-w-4xl mx-auto">
        <Card className="p-4 md:p-6 bg-neutral-900 border-neutral-800 card-elegant">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 flex items-center">
            <Route className="w-5 h-5 mr-2 text-blue-500" />
            Détails du trajet
          </h2>
          <div className="grid gap-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <MapPinIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Départ</p>
                <p className="text-neutral-100">{departure.display_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <ArrowRight className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Destination</p>
                <p className="text-neutral-100">{destination.display_name}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <CalendarIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Date</p>
                <p className="text-neutral-100">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <Clock className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Heure</p>
                <p className="text-neutral-100">{formattedTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                <CarIcon className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-neutral-400 mb-1">Type de véhicule</p>
                <p className="text-neutral-100">{selectedVehicle === "STANDARD" ? "Berline Premium" : "Van de Luxe"}</p>
              </div>
            </div>
            {selectedOptions?.length > 0 && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                  <PackageCheck className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Options</p>
                  <ul className="space-y-1">
                    {selectedOptions?.map((option) => (
                      <li key={option} className="text-neutral-100">
                        {option === "accueil"
                          ? "Accueil personnalisé"
                          : option === "boissons"
                            ? "Boissons fraîches"
                            : option}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            {(distance || duration || priceDetails) && (
              <>
                <SimpleSeparator className="my-3 md:my-4" />
                <div className="grid gap-2 bg-neutral-800/40 p-3 rounded-lg">
                  {distance && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Distance estimée</span>
                      <span className="text-neutral-100 font-medium">{distance} km</span>
                    </div>
                  )}
                  {duration && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Durée estimée</span>
                      <span className="text-neutral-100 font-medium">{formatDuration(duration)}</span>
                    </div>
                  )}
                  {priceDetails && (
                    <>
                      <SimpleSeparator className="my-2" />
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Prix de base</span>
                        <span className="text-neutral-100 font-medium">{priceDetails.basePrice}€</span>
                      </div>
                      {priceDetails.optionsPrice > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Options</span>
                          <span className="text-neutral-100 font-medium">+{priceDetails.optionsPrice}€</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold mt-2">
                        <span className="text-neutral-300">Total estimé</span>
                        <span className="text-blue-400">{priceDetails.totalPrice}€</span>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>
        <Suspense fallback={<Card className="p-4 md:p-6"><LoadingSpinner /></Card>}>
          <Card className="p-0 overflow-hidden bg-neutral-900 border-neutral-800 rounded-xl">
            <div className="h-48 md:h-64 lg:h-80">
              <MapLibreMap
                departure={departure}
                destination={destination}
                onRouteCalculated={() => {}}
              />
            </div>
          </Card>
        </Suspense>
        <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mt-2 md:mt-4">
          <Button
            variant="outline"
            onClick={handleModify}
            className="flex-1 bg-neutral-800 border-neutral-700 hover:bg-neutral-700 text-neutral-100 py-3 md:py-3"
            disabled={isLoading}
          >
            Modifier
          </Button>
          <Button
            onClick={handleConfirm}
            className="flex-1 btn-gradient hover:opacity-90 text-neutral-100 py-4 md:py-3"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Enregistrement...
              </>
            ) : (
              "Confirmer les modifications"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}