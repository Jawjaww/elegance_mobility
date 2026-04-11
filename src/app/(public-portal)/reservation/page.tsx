"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/useToast";
import LocationStep from "../../../components/reservation/LocationStep";
import VehicleStep from "../../../components/reservation/VehicleStep";
import { useReservation } from "../../../hooks/useReservation";
import { useReservationStore } from "@/lib/stores/reservationStore";

export default function ReservationPage() {
  const router = useRouter();
  const { toast } = useToast();
  const reservationStore = useReservationStore();

  const {
    step,
    originAddress,
    destinationAddress,
    pickupDateTime,
    distance,
    duration,
    vehicleType,
    options,
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
    setOptions,
  } = useReservation();

  // Gestion de la modification d'une réservation existante
  const handleCompleteReservation = async () => {
    if (false) {
      const reservationId = localStorage.getItem("currentEditingReservationId");

      if (!reservationId) {
        toast({
          title: "Erreur",
          description: "ID de réservation manquant pour la modification.",
          variant: "destructive",
        });
        return;
      }

      // Au lieu de mettre à jour directement dans la BD, utiliser handleReservation pour passer par la page confirmation
      handleReservation();
    } else {
      // Pour une nouvelle réservation, continuer avec le comportement existant
      handleReservation();
    }
  };

  return (
    <section className="relative grid min-h-screen bg-neutral-950 overflow-hidden">
      <div className="absolute inset-0 perspective-[1000px]">
        <div className="relative h-full w-full [transform-style:preserve-3d]">
          <div className="absolute inset-0 bg-[url('/images/car-bg.jpg')] bg-cover bg-center [transform:translateZ(-100px)] scale-110" />
          <div className="absolute inset-0 bg-neutral-950/90 backdrop-blur-3xl [transform:translateZ(-50px)]" />
        </div>
      </div>

      <div className="relative z-10 place-self-center w-full max-w-2xl mx-auto px-4 py-8">
        <div className="bg-neutral-900/50 backdrop-blur-lg rounded-lg border border-neutral-800 p-8">
          {step === 1 ? (
            <LocationStep
              onNextStep={handleNextStep}
              isEditing={false}
              onLocationDetected={handleLocationDetected}
              onOriginChange={setOriginAddress}
              onDestinationChange={setDestinationAddress}
              onOriginSelect={handleOriginSelect}
              onDestinationSelect={handleDestinationSelect}
              onRouteCalculated={handleRouteCalculated}
              onDateTimeChange={setPickupDateTime}
              pickupDateTime={pickupDateTime}
              originAddress={originAddress}
              destinationAddress={destinationAddress}
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
              onConfirm={handleReservation}
              isEditing={false}
            />
          )}
        </div>
      </div>
    </section>
  );
}
