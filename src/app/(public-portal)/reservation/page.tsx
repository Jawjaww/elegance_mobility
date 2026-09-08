"use client";

import LocationStep from "../../../components/reservation/LocationStep";
import VehicleStep from "../../../components/reservation/VehicleStep";
import { useReservation } from "../../../hooks/useReservation";
import { LandingDesktopPanel } from "@/components/landing/LandingDesktopPanel";

export default function ReservationPage() {
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
    handleRouteCalculated,
    setPickupDateTime,
    setOriginAddress,
    setDestinationAddress,
    setVehicleType,
    setOptions,
  } = useReservation();

  return (
    <section className="relative min-h-[calc(100svh-4rem)]">
      <div className="relative z-10 mx-auto w-full max-w-2xl px-4 py-6 sm:px-6 sm:py-10">
        <LandingDesktopPanel>
          {step === 1 ? (
            <LocationStep
              onNextStep={handleNextStep}
              isEditing={false}
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
        </LandingDesktopPanel>
      </div>
    </section>
  );
}
