"use client";

import { Suspense } from "react";
import LocationStep from "../../../components/reservation/LocationStep";
import VehicleStep from "../../../components/reservation/VehicleStep";
import { useReservation } from "../../../hooks/useReservation";
import { LandingDesktopPanel } from "@/components/landing/LandingDesktopPanel";
import { LANDING_PAGE_FLOW } from "@/components/landing/landingSurface";

function ReservationPageContent() {
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
    <section className={`relative ${LANDING_PAGE_FLOW} lg:py-4`}>
      <div className="relative z-10 mx-auto w-full max-w-2xl lg:max-w-6xl">
        <LandingDesktopPanel className="lg:p-5">
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

export default function ReservationPage() {
  return (
    <Suspense fallback={null}>
      <ReservationPageContent />
    </Suspense>
  );
}
