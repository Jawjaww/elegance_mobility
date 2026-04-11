"use client";

import { useDriverStore } from "@/lib/driver/store";
import { useDriverLocation, useWakeLock } from "@/lib/driver/hooks";
import { useDriverSubscription } from "@/lib/driver/useDriverSubscription";
import {
  Header,
  DriverBottomSheet,
  FullscreenRideModal,
  ScheduledRideNotifications,
} from "@/components/driver";
import UnifiedMap from "@/components/map/UnifiedMap";

export default function DriverDashboardPage() {
  const { isOnline, availableRide, activeRide, currentLocation } =
    useDriverStore();

  // Activer la géolocalisation et le wake lock
  useDriverLocation(isOnline);
  useWakeLock(isOnline);

  // Active la souscription aux courses en temps réel
  useDriverSubscription();

  const pickup = availableRide
    ? { lat: availableRide.pickupLat, lng: availableRide.pickupLng }
    : activeRide
      ? { lat: activeRide.pickupLat, lng: activeRide.pickupLng }
      : undefined;

  const dropoff = availableRide
    ? { lat: availableRide.dropoffLat, lng: availableRide.dropoffLng }
    : activeRide
      ? { lat: activeRide.dropoffLat, lng: activeRide.dropoffLng }
      : undefined;

  return (
    <div className="relative w-full h-[100dvh] bg-neutral-950">
      {/* Carte plein écran */}
      <div className="absolute inset-0 w-full h-full">
        <UnifiedMap
          mode="TRACKING"
          pickup={pickup}
          dropoff={dropoff}
          driverLocation={
            currentLocation
              ? {
                  lat: currentLocation.lat,
                  lng: currentLocation.lng,
                  heading: currentLocation.heading ?? undefined,
                }
              : undefined
          }
        />
      </div>

      {/* Header flottant */}
      <Header />

      {/* Notifications pour courses planifiées */}
      <ScheduledRideNotifications />

      {/* Bottom sheet avec onglets */}
      <DriverBottomSheet />

      {/* Modal plein écran pour courses en temps réel */}
      <FullscreenRideModal />
    </div>
  );
}
