"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import type { Database } from "@/lib/types/database.types";
import { supabase } from "@/lib/database/client";
import LocationStep from "@/components/reservation/LocationStep";
import VehicleStep from "@/components/reservation/VehicleStep";
import {
  selectedFromVehicleOptions,
  vehicleOptionsFromSelected,
} from "@/lib/vehicle";
import { normalizeSelectedOptions } from "@/lib/services/optionsCatalogService";
import { useReservationStore } from "@/lib/stores/reservationStore";
import { LandingDesktopPanel } from "@/components/landing/LandingDesktopPanel";
import { LANDING_PAGE_FLOW } from "@/components/landing/landingSurface";

type Reservation = Database["public"]["Tables"]["rides"]["Row"];

function EditReservationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams?.get("id") || null;

  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [storeInitialized, setStoreInitialized] = useState(false);
  const reservationStore = useReservationStore();

  useEffect(() => {
    if (!reservationId) {
      setError("Identifiant de réservation manquant");
      setLoading(false);
      return;
    }

    async function fetchReservation() {
      try {
        const { data, error } = await supabase
          .from("rides")
          .select("*")
          .eq("id", reservationId)
          .single();

        if (error) throw error;

        setReservation(data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching reservation:", err);
        setError("Erreur lors de la récupération de la réservation");
        setLoading(false);
      }
    }

    fetchReservation();
  }, [reservationId]);

  useEffect(() => {
    if (reservation && !storeInitialized) {
      reservationStore.setDeparture({
        lat: reservation.pickup_lat || 0,
        lon: reservation.pickup_lon || 0,
        display_name: reservation.pickup_address,
        address: { formatted: reservation.pickup_address },
      });
      reservationStore.setDestination({
        lat: reservation.dropoff_lat || 0,
        lon: reservation.dropoff_lon || 0,
        display_name: reservation.dropoff_address,
        address: { formatted: reservation.dropoff_address },
      });
      reservationStore.setPickupDateTime(new Date(reservation.pickup_time));
      (async () => {
        try {
          const { assertVehicleType } = await import("@/lib/utils/vehicle");
          const v = reservation.vehicle_type as unknown;
          reservationStore.setSelectedVehicle(assertVehicleType(v));
        } catch (e) {
          console.error("[VEHICLE] Invalid vehicle type from DB", e);
          throw e;
        }
      })();
      reservationStore.setDistance(reservation.distance || 0);
      reservationStore.setDuration(reservation.duration || 0);
      reservationStore.setSelectedOptions(
        normalizeSelectedOptions(reservation.options || []),
      );
      setStoreInitialized(true);
    }
  }, [reservation, storeInitialized, reservationStore]);

  const handleNextStep = () => setStep((s) => s + 1);
  const handlePrevStep = () => setStep((s) => s - 1);

  const handleContinueToConfirmation = () => {
    if (!reservationId) return;
    router.push(
      `/my-account/reservations/edit-confirmation?id=${reservationId}`,
    );
  };

  if (!reservationId) {
    return (
      <section className={`relative ${LANDING_PAGE_FLOW}`}>
        <div className="relative z-10 mx-auto w-full max-w-2xl">
          <LandingDesktopPanel>
            <div className="space-y-4 text-center">
              <h2 className="text-xl font-bold text-red-500">Erreur</h2>
              <p>Identifiant de réservation manquant</p>
              <Button onClick={() => router.push("/my-account/reservations")}>
                Retour
              </Button>
            </div>
          </LandingDesktopPanel>
        </div>
      </section>
    );
  }

  let body: ReactNode;
  if (loading) {
    body = (
      <div className="my-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  } else if (error) {
    body = (
      <div className="space-y-4 text-center">
        <h2 className="text-xl font-bold text-red-500">Erreur</h2>
        <p>{error}</p>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    );
  } else if (reservation) {
    body =
      step === 1 ? (
        <LocationStep
          onNextStep={handleNextStep}
          isEditing={true}
          onOriginChange={() => {}}
          onDestinationChange={() => {}}
          onOriginSelect={() => {}}
          onDestinationSelect={() => {}}
          onRouteCalculated={() => {}}
          onDateTimeChange={reservationStore.setPickupDateTime}
          pickupDateTime={reservationStore.pickupDateTime}
          originAddress={reservationStore.departure?.display_name || ""}
          destinationAddress={
            reservationStore.destination?.display_name || ""
          }
        />
      ) : (
        <VehicleStep
          vehicleType={reservationStore.selectedVehicle}
          options={vehicleOptionsFromSelected(
            normalizeSelectedOptions(reservationStore.selectedOptions),
          )}
          distance={reservationStore.distance ?? undefined}
          duration={reservationStore.duration ?? undefined}
          onVehicleTypeChange={reservationStore.setSelectedVehicle}
          onOptionsChange={(nextOptions) =>
            reservationStore.setSelectedOptions(
              normalizeSelectedOptions(
                selectedFromVehicleOptions(nextOptions),
              ),
            )
          }
          onPrevious={handlePrevStep}
          onConfirm={handleContinueToConfirmation}
          isEditing={true}
        />
      );
  } else {
    body = (
      <div className="space-y-4 text-center">
        <p>Réservation non trouvée</p>
        <Button onClick={() => router.back()}>Retour</Button>
      </div>
    );
  }

  return (
    <section className={`relative ${LANDING_PAGE_FLOW} lg:py-4`}>
      <div className="relative z-10 mx-auto w-full max-w-2xl lg:max-w-6xl">
        <LandingDesktopPanel className="lg:p-5">{body}</LandingDesktopPanel>
      </div>
    </section>
  );
}

export default function EditReservationPage() {
  return (
    <Suspense
      fallback={
        <div className="my-12 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <EditReservationContent />
    </Suspense>
  );
}
