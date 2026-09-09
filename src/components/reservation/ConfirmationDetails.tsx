"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDuration, cn } from "@/lib/utils";
import { CalendarIcon, CarIcon, Route } from "lucide-react";
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
import { LANDING_CTA } from "@/components/landing/landingSurface";

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
  if (vehicle === "STANDARD") return "Berline";
  if (vehicle === "PREMIUM") return "Berline premium";
  if (vehicle === "VAN") return "Van de confort";
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
  setPickupDateTime: (date: Date) => void;
  router: ReturnType<typeof useRouter>;
}) {
  await resolveRideFinalPrice({
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
  args.router.push("/my-account/reservations/reservation-success");
}

function reservationErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Une erreur est survenue lors de la création de la réservation. Veuillez réessayer.";
}


function Fact({
  icon: Icon,
  label,
  children,
}: Readonly<{
  icon: typeof CalendarIcon;
  label: string;
  children: React.ReactNode;
}>) {
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
        <Icon className="h-3 w-3 text-blue-400" aria-hidden />
        {label}
      </p>
      <p className="mt-0.5 text-sm leading-snug text-white">{children}</p>
    </div>
  );
}

function TripSummaryBar({
  distance,
  duration,
  priceDetails,
}: Readonly<{
  distance?: number | null;
  duration?: number | null;
  priceDetails: PriceDetails | null;
}>) {
  return (
    <div className="rounded-2xl border border-blue-500/15 bg-neutral-800/40 px-4 py-3 sm:px-6 sm:py-4">
      {(distance || duration) && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 sm:gap-x-8">
          {distance ? (
            <div className="sm:col-span-2">
              <p className="text-xs text-neutral-400 sm:text-sm">Distance estimée</p>
              <p className="mt-0.5 text-base font-semibold text-white sm:mt-1 sm:text-lg">
                {distance} km
              </p>
            </div>
          ) : null}
          {duration ? (
            <div
              className={cn(
                "text-right sm:col-span-2",
                !distance && "col-span-2 text-left",
              )}
            >
              <p className="text-xs text-neutral-400 sm:text-sm">Durée estimée</p>
              <p className="mt-0.5 text-base font-semibold text-white sm:mt-1 sm:text-lg">
                {formatDuration(duration)}
              </p>
            </div>
          ) : null}
        </div>
      )}

      {priceDetails && (
        <div
          className={cn(
            "grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 sm:gap-x-8",
            (distance || duration) &&
              "mt-3 border-t border-neutral-700/50 pt-3 sm:mt-4 sm:pt-4",
          )}
        >
          <div className="sm:col-span-2">
            <p className="text-xs text-neutral-400 sm:text-sm">Prix de base</p>
            <p className="mt-0.5 text-base font-semibold text-white sm:mt-1 sm:text-lg">
              {priceDetails.basePrice}€
              {priceDetails.optionsPrice > 0 ? (
                <span className="ml-2 text-sm font-normal text-neutral-400">
                  (+{priceDetails.optionsPrice}€ options)
                </span>
              ) : null}
            </p>
          </div>
          <div className="text-right sm:col-span-2">
            <p className="text-xs text-neutral-400 sm:text-sm">Total estimé</p>
            <p className="mt-0.5 text-xl font-bold text-blue-400 sm:mt-1 sm:text-2xl">
              {priceDetails.totalPrice}€
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

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
        setPickupDateTime: reservationStore.setPickupDateTime,
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
    <div className="mx-auto w-full max-w-4xl py-3 pb-5 md:py-6 lg:max-w-6xl lg:py-5">
      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        defaultTab="login"
      />

      <div className="mb-3 text-center md:mb-6">
        <h1 className="text-xl font-bold text-white md:mb-1 md:text-2xl">
          Confirmation de réservation
        </h1>
        <p className="mt-0.5 text-xs text-neutral-400 md:text-sm">
          Vérifiez les détails avant de confirmer votre trajet
        </p>
      </div>

      <div className="grid gap-3 md:gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="order-1 border-blue-500/20 bg-neutral-900/80 p-4 md:rounded-3xl md:p-5 lg:col-start-1 lg:row-start-1">
          <h2 className="mb-3 flex items-center text-sm font-semibold text-white md:text-base">
            <Route className="mr-2 h-4 w-4 text-blue-500" aria-hidden />
            Détails du trajet
          </h2>

          <div className="flex gap-3">
            <div className="flex w-3 shrink-0 flex-col items-center pt-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/15" />
              <span className="my-1 w-px flex-1 bg-gradient-to-b from-emerald-400/50 to-sky-400/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-sky-400 ring-4 ring-sky-400/15" />
            </div>
            <div className="min-w-0 flex-1 space-y-3">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                  Départ
                </p>
                <p className="mt-0.5 text-sm leading-snug text-white">
                  {departure.display_name}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                  Destination
                </p>
                <p className="mt-0.5 text-sm leading-snug text-white">
                  {destination.display_name}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/[0.08] pt-3">
            <Fact icon={CalendarIcon} label="Date et heure">
              <span className="capitalize">{formattedDate}</span>
              {formattedTime ? (
                <span className="text-neutral-400"> · {formattedTime}</span>
              ) : null}
            </Fact>
            <Fact icon={CarIcon} label="Véhicule">
              {vehicleLabel(selectedVehicle)}
            </Fact>
          </div>

          {selectedOptions.length > 0 ? (
            <div className="mt-3 border-t border-white/[0.08] pt-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                Options
              </p>
              <ul className="mt-1.5 flex flex-wrap gap-1.5">
                {selectedOptions.map((option) => (
                  <li
                    key={option}
                    className="rounded-full border border-blue-500/25 bg-blue-500/10 px-2.5 py-0.5 text-xs text-blue-100"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </Card>

        <Suspense
          fallback={
            <Card className="order-2 p-4 md:p-6 lg:col-start-2 lg:row-start-1">
              <LoadingSpinner />
            </Card>
          }
        >
          <Card className="order-2 overflow-hidden rounded-xl border-blue-500/20 bg-neutral-900/80 p-0 md:rounded-3xl lg:col-start-2 lg:row-start-1">
            <div className="h-48 md:h-64 lg:h-[min(18.5rem,calc(100svh-13rem))]">
              <ReservationMap
                departure={departure}
                destination={destination}
                onRouteCalculated={handleRouteCalculated}
                className="h-48 md:h-64 lg:h-[min(18.5rem,calc(100svh-13rem))]"
                height="100%"
              />
            </div>
          </Card>
        </Suspense>

        {(distance || duration || priceDetails) && (
          <div className="order-3 w-full lg:col-span-2">
            <TripSummaryBar
              distance={distance}
              duration={duration}
              priceDetails={priceDetails}
            />
          </div>
        )}

        <div className="order-4 flex gap-2 md:gap-4 lg:col-span-2">
          <Button
            variant="outline"
            onClick={handleModify}
            className="flex-1 border-blue-400/30 bg-transparent py-2.5 text-white hover:bg-blue-500/15 md:py-3"
            disabled={isLoading}
          >
            Modifier
          </Button>
          <Button
            onClick={handleConfirm}
            className={`flex-1 py-2.5 md:py-3 ${LANDING_CTA}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Création en cours...
              </>
            ) : (
              <>
                <span className="md:hidden">Confirmer</span>
                <span className="hidden md:inline">
                  Confirmer la réservation
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
