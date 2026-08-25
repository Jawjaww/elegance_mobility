"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDuration } from "@/lib/utils";
import {
  CalendarIcon,
  Clock,
  MapPinIcon,
  CarIcon,
  PackageCheck,
  ArrowRight,
  Route,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Database } from "@/lib/types/database.types";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { supabase } from "@/lib/database/client";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import ReservationMap from "@/components/map/ReservationMap";
import { AuthModal } from "../../app/auth/login/AuthModal";
import { pricingService } from "@/lib/services/pricingService";
import { resolveRideFinalPrice } from "@/lib/services/resolveRideFinalPrice";
import { normalizePickupDateTime } from "@/lib/utils/normalizePickupDateTime";
import type { VehicleType } from "@/lib/vehicle";

// Type de la table rides de Supabase
type Ride = Database["public"]["Tables"]["rides"]["Row"];

type PriceDetails = {
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
};

type RideEndpoint = { display_name: string; lat: number; lon: number };

function toPickupDate(pickupDateTime: Date | string): Date {
  return pickupDateTime instanceof Date
    ? pickupDateTime
    : new Date(pickupDateTime);
}

function toNullableNumber(value: number | null | undefined): number | null {
  return value ?? null;
}

function vehicleLabel(vehicle: VehicleType): string {
  if (vehicle === "STANDARD") return "Berline Premium";
  if (vehicle === "VAN") return "Van de Luxe";
  return vehicle;
}

function buildPendingRidePayload(input: {
  userId: string;
  departure: RideEndpoint;
  destination: RideEndpoint;
  pickupDateTime: Date | string;
  selectedVehicle: VehicleType;
  selectedOptions: string[];
  distance: number | null | undefined;
  duration: number | null | undefined;
  estimatedPrice: number | null | undefined;
}): Partial<Ride> {
  const dateObj = toPickupDate(input.pickupDateTime);
  return {
    user_id: input.userId,
    pickup_address: input.departure.display_name,
    pickup_lat: input.departure.lat,
    pickup_lon: input.departure.lon,
    dropoff_address: input.destination.display_name,
    dropoff_lat: input.destination.lat,
    dropoff_lon: input.destination.lon,
    pickup_time: dateObj.toISOString(),
    vehicle_type: input.selectedVehicle,
    options: input.selectedOptions,
    distance: toNullableNumber(input.distance),
    duration: toNullableNumber(input.duration),
    status: "pending",
    estimated_price: toNullableNumber(input.estimatedPrice),
    final_price: null,
  };
}

function confirmationDescription(
  departure: RideEndpoint,
  destination: RideEndpoint,
  formattedDate: string,
  formattedTime: string,
  finalPrice: number | null,
): string {
  const from = departure.display_name.split(",")[0];
  const to = destination.display_name.split(",")[0];
  const base = `Votre trajet de ${from} à ${to} a été enregistré pour le ${formattedDate} à ${formattedTime}.`;
  if (finalPrice != null) {
    return `${base} Prix final : ${finalPrice}€.`;
  }
  return `${base} Un e-mail de confirmation vous a été envoyé.`;
}

async function finalizeConfirmedRide(args: {
  rideId: string;
  selectedVehicle: VehicleType;
  departure: RideEndpoint;
  destination: RideEndpoint;
  selectedOptions: string[];
  distance: number | null | undefined;
  duration: number | null | undefined;
  fallbackPrice: number | null | undefined;
  estimatedPrice: number | null | undefined;
  formattedDate: string;
  formattedTime: string;
  setPickupDateTime: (date: Date) => void;
  toast: ReturnType<typeof useToast>["toast"];
  router: ReturnType<typeof useRouter>;
}) {
  const finalPrice = await resolveRideFinalPrice({
    rideId: args.rideId,
    vehicleType: args.selectedVehicle,
    pickupLat: args.departure.lat,
    pickupLon: args.departure.lon,
    dropoffLat: args.destination.lat,
    dropoffLon: args.destination.lon,
    options: args.selectedOptions,
    distance: toNullableNumber(args.distance),
    duration: toNullableNumber(args.duration),
    fallbackPrice: toNullableNumber(
      args.fallbackPrice ?? args.estimatedPrice,
    ),
  });

  sessionStorage.setItem("last_confirmed_reservation", args.rideId);
  args.setPickupDateTime(normalizePickupDateTime(new Date()));
  args.toast({
    title: "✨ Réservation confirmée",
    description: confirmationDescription(
      args.departure,
      args.destination,
      args.formattedDate,
      args.formattedTime,
      finalPrice,
    ),
    variant: "success",
  });
  setTimeout(() => {
    args.router.push("/my-account/reservations/reservation-success");
  }, 2000);
}

function reservationErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue lors de la création de la réservation. Veuillez réessayer.";
}

const SimpleSeparator = ({ className }: { className?: string }) => (
  <div className={`h-[1px] w-full bg-neutral-800 my-2 ${className || ""}`} />
);

export function ConfirmationDetails() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);

  const reservationStore = useReservationStore();
  const {
    departure,
    destination,
    pickupDateTime,
    selectedVehicle,
    selectedOptions,
    distance,
    duration,
  } = reservationStore;

  // État local pour gérer la date formatée
  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

  // Gestion sécurisée du formatage de la date
  useEffect(() => {
    if (pickupDateTime) {
      try {
        const dateObj =
          pickupDateTime instanceof Date
            ? pickupDateTime
            : new Date(pickupDateTime);
        setFormattedDate(format(dateObj, "EEEE d MMMM yyyy", { locale: fr }));
        setFormattedTime(format(dateObj, "HH:mm", { locale: fr }));
      } catch (error) {
        console.error("Erreur lors du formatage de la date:", error);
        setFormattedDate("Date non valide");
        setFormattedTime("");
      }
    }
  }, [pickupDateTime]);

  // État pour gérer l'affichage du modal d'authentification
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleConfirm = async () => {
    if (!departure || !destination || !pickupDateTime || !selectedVehicle) {
      toast({
        title: "Erreur",
        description: "Informations de réservation incomplètes",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (!currentUser) {
        setIsLoading(false);
        setShowAuthModal(true);
        return;
      }

      const newRide = buildPendingRidePayload({
        userId: currentUser.id,
        departure,
        destination,
        pickupDateTime,
        selectedVehicle,
        selectedOptions,
        distance,
        duration,
        estimatedPrice: priceDetails?.totalPrice,
      });

      const { data, error } = await supabase
        .from("rides")
        .insert(newRide)
        .select()
        .single();

      if (error) throw error;
      if (!data?.id) return;

      await finalizeConfirmedRide({
        rideId: data.id,
        selectedVehicle,
        departure,
        destination,
        selectedOptions,
        distance,
        duration,
        fallbackPrice: priceDetails?.totalPrice,
        estimatedPrice: data.estimated_price,
        formattedDate,
        formattedTime,
        setPickupDateTime: reservationStore.setPickupDateTime,
        toast,
        router,
      });
    } catch (error: unknown) {
      console.error("Erreur lors de la création de la réservation:", error);
      toast({
        title: "Erreur lors de la création de la réservation",
        description: reservationErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModify = () => {
    router.push("/reservation");
  };

  // Handler when the map calculates a route; normalize types and update store
  const handleRouteCalculated = (
    distanceMeters: number,
    durationSeconds: number,
  ) => {
    try {
      const distanceKm = Math.round(distanceMeters / 1000);
      const durationMin = Math.round(durationSeconds / 60);
      reservationStore.setDistance(distanceKm);
      reservationStore.setDuration(durationMin);
    } catch (e) {
      console.warn("Erreur lors de la mise à jour de la distance/durée:", e);
    }
  };

  // Calculer le prix dès que les informations nécessaires sont disponibles
  useEffect(() => {
    const calculatePrice = async () => {
      if (departure && destination && selectedVehicle && distance) {
        try {
          const result = await pricingService.calculatePrice(
            distance,
            selectedVehicle,
            selectedOptions,
          );
          setPriceDetails(result);
        } catch (error: unknown) {
          const message =
            error instanceof Error
              ? error.message
              : "Impossible d'estimer le prix pour le moment.";
          toast({
            title: "Erreur de tarification",
            description: message,
            variant: "destructive",
          });
          console.debug("Erreur lors du calcul du prix (détail):", error);
        }
      }
    };
    calculatePrice();
  }, [departure, destination, selectedVehicle, selectedOptions, distance]);

  useEffect(() => {
    if (!departure || !destination || !pickupDateTime || !selectedVehicle) {
      router.push("/reservation");
    }
  }, [departure, destination, pickupDateTime, selectedVehicle, router]);

  if (!departure || !destination || !pickupDateTime || !selectedVehicle) {
    return (
      <div className="container mx-auto py-12 flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const handleAuthSuccess = async () => {
    setShowAuthModal(false);
    setTimeout(() => {
      handleConfirm();
    }, 300);
  };

  return (
    <div className="container mx-auto py-6 md:py-8 mb-20 px-4 md:px-6">
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        defaultTab="login"
      />

      <div className="mb-6 md:mb-8 text-center">
        <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-elegant-gradient bg-clip-text text-transparent">
          Confirmation de réservation
        </h1>
        <p className="text-neutral-400">
          Vérifiez les détails avant de confirmer votre trajet
        </p>
      </div>

      <div className="grid gap-6 md:gap-8 max-w-4xl mx-auto">
        <Card className="p-4 md:p-6 bg-neutral-900 border-neutral-800">
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
                <p className="text-sm text-neutral-400 mb-1">
                  Type de véhicule
                </p>
                <p className="text-neutral-100">
                  {vehicleLabel(selectedVehicle)}
                </p>
              </div>
            </div>

            {selectedOptions.length > 0 && (
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 h-8 w-8 bg-blue-600/20 rounded-full flex items-center justify-center mt-1">
                  <PackageCheck className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-sm text-neutral-400 mb-1">Options</p>
                  <ul className="space-y-1">
                    {selectedOptions.map((option) => (
                      <li key={option} className="text-neutral-100">
                        {option}
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
                      <span className="text-neutral-100 font-medium">
                        {distance} km
                      </span>
                    </div>
                  )}
                  {duration && (
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Durée estimée</span>
                      <span className="text-neutral-100 font-medium">
                        {formatDuration(duration)}
                      </span>
                    </div>
                  )}
                  {priceDetails && (
                    <>
                      <SimpleSeparator className="my-2" />
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Prix de base</span>
                        <span className="text-neutral-100 font-medium">
                          {priceDetails.basePrice}€
                        </span>
                      </div>
                      {priceDetails.optionsPrice > 0 && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Options</span>
                          <span className="text-neutral-100 font-medium">
                            +{priceDetails.optionsPrice}€
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold mt-2">
                        <span className="text-neutral-300">Total estimé</span>
                        <span className="text-blue-400">
                          {priceDetails.totalPrice}€
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </Card>

        <Suspense
          fallback={
            <Card className="p-4 md:p-6">
              <LoadingSpinner />
            </Card>
          }
        >
          <Card className="p-0 overflow-hidden bg-neutral-900 border-neutral-800 rounded-xl">
            <div className="h-48 md:h-64 lg:h-80">
              <ReservationMap
                departure={departure}
                destination={destination}
                onRouteCalculated={handleRouteCalculated}
                className="h-48 md:h-64 lg:h-80"
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
                Création en cours...
              </>
            ) : (
              "Confirmer la réservation"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
