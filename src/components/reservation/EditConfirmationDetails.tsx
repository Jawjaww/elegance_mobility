"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDuration, cn } from "@/lib/utils";
import { CalendarIcon, CarIcon, Route } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { reservationService } from "@/lib/services/reservationService";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "../ui/loading-spinner";
import { Suspense, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import ReservationMap from "@/components/map/ReservationMap";
import { pricingService } from "@/lib/services/pricingService";
import { resolveRideFinalPrice } from "@/lib/services/resolveRideFinalPrice";
import { LANDING_CTA } from "@/components/landing/landingSurface";
import { TripEndpointRail } from "@/components/reservation/TripEndpointRail";
import type { VehicleType } from "@/lib/vehicle";

type EditConfirmationDetailsProps = {
  reservationId: string;
};

type PriceDetails = {
  basePrice: number;
  optionsPrice: number;
  totalPrice: number;
};

function vehicleLabel(vehicle: VehicleType): string {
  if (vehicle === "STANDARD") return "Berline";
  if (vehicle === "PREMIUM") return "Berline premium";
  if (vehicle === "VAN") return "Van de confort";
  return vehicle;
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
              <p className="text-xs text-neutral-400 sm:text-sm">
                Distance estimée
              </p>
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
              <p className="text-xs text-neutral-400 sm:text-sm">
                Durée estimée
              </p>
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

export function EditConfirmationDetails({
  reservationId,
}: Readonly<EditConfirmationDetailsProps>) {
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

  const [formattedDate, setFormattedDate] = useState("");
  const [formattedTime, setFormattedTime] = useState("");

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
        console.error(
          "[EditConfirmationDetails] invalid pickupDateTime",
          error,
        );
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
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const dateObj =
        pickupDateTime instanceof Date
          ? pickupDateTime
          : new Date(pickupDateTime);

      const { success, error } = await reservationService.updateReservation(
        reservationId,
        {
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
        },
      );

      if (!success) {
        throw error instanceof Error
          ? error
          : new Error("Erreur lors de la mise à jour");
      }

      await resolveRideFinalPrice({
        rideId: reservationId,
        vehicleType: selectedVehicle,
        pickupLat: departure.lat,
        pickupLon: departure.lon,
        dropoffLat: destination.lat,
        dropoffLon: destination.lon,
        options: Array.isArray(selectedOptions) ? selectedOptions : [],
        distance: distance ?? null,
        duration: duration ?? null,
        fallbackPrice: priceDetails?.totalPrice ?? null,
      });

      toast({
        title: "Modification enregistrée",
        description: "Les modifications de votre trajet ont été enregistrées.",
        variant: "success",
      });

      router.push("/my-account/reservations");
    } catch (error: unknown) {
      toast({
        title: "Erreur lors de la modification",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleModify = () => {
    router.push(`/my-account/reservations/edit?id=${reservationId}`);
  };

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

  useEffect(() => {
    const calculatePrice = async () => {
      if (departure && destination && selectedVehicle && distance) {
        try {
          const result = await pricingService.calculatePrice(
            distance,
            selectedVehicle,
            selectedOptions || [],
          );
          setPriceDetails(result);
        } catch (error) {
          console.warn("Erreur lors du calcul du prix:", error);
        }
      }
    };
    calculatePrice();
  }, [departure, destination, selectedVehicle, selectedOptions, distance]);

  if (!departure || !destination || !pickupDateTime || !selectedVehicle) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl py-3 pb-5 md:py-6 lg:max-w-6xl lg:py-5">
      <div className="mb-3 text-center md:mb-6">
        <h1 className="text-xl font-bold text-white md:mb-1 md:text-2xl">
          Confirmation des modifications
        </h1>
        <p className="mt-0.5 text-xs text-neutral-400 md:text-sm">
          Vérifiez les changements avant de valider
        </p>
      </div>

      <div className="grid gap-3 md:gap-6 lg:grid-cols-2 lg:items-start">
        <Card className="order-1 border-blue-500/20 bg-neutral-900/80 p-4 md:rounded-3xl md:p-5 lg:col-start-1 lg:row-start-1">
          <h2 className="mb-3 flex items-center text-sm font-semibold text-white md:text-base">
            <Route className="mr-2 h-4 w-4 text-blue-500" aria-hidden />
            Détails du trajet
          </h2>

          <div className="flex gap-3">
            <TripEndpointRail className="pt-1.5" />
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

        <div className="order-4 flex w-full gap-3 md:gap-4 lg:col-span-2 lg:gap-5">
          <Button
            variant="outline"
            onClick={handleModify}
            className="min-h-11 flex-1 px-8 text-base border-blue-400/30 bg-transparent text-white hover:bg-blue-500/15 md:min-h-12 md:px-10"
            disabled={isLoading}
          >
            Modifier
          </Button>
          <Button
            onClick={handleConfirm}
            className={`min-h-11 flex-1 px-8 text-base md:min-h-12 md:px-10 ${LANDING_CTA}`}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Enregistrement...
              </>
            ) : (
              <>
                <span className="md:hidden">Confirmer</span>
                <span className="hidden md:inline">
                  Confirmer les modifications
                </span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
