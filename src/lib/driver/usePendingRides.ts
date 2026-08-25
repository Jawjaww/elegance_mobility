"use client";

import { useEffect, useCallback } from "react";
import { driverRideService, AcceptRideResult } from "./rideService";
import { useDriverStore } from "./store";
import { openExternalNavigation } from "./externalNavigation";

/**
 * Hook pour gérer les courses en attente dans le dashboard chauffeur
 * - S'abonne aux nouvelles courses en temps réel
 * - Gère l'acceptation des courses
 */
export function usePendingRides() {
  const { isOnline, availableRide, setAvailableRide, setActiveRide } = useDriverStore();

  // S'abonner aux courses quand le chauffeur est en ligne
  useEffect(() => {
    if (!isOnline) {
      driverRideService.unsubscribe();
      return;
    }

    driverRideService.fetchPendingRides().then((rides) => {
      if (rides.length > 0 && !availableRide) {
        setAvailableRide(rides[0]);
        void driverRideService.recordOffer(rides[0].id);
      }
    });

    driverRideService.subscribeToPendingRides(
      (ride) => {
        console.log("[usePendingRides] New ride received:", ride.id);
        setAvailableRide(ride);
        void driverRideService.recordOffer(ride.id);
      },
      (ride) => {
        console.log("[usePendingRides] Ride updated:", ride.id);
        if (availableRide?.id === ride.id) {
          setAvailableRide(ride);
        }
      },
      (rideId) => {
        console.log("[usePendingRides] Ride removed:", rideId);
        if (availableRide?.id === rideId) {
          setAvailableRide(null);
        }
      }
    );

    return () => {
      driverRideService.unsubscribe();
    };
  }, [isOnline, availableRide?.id, setAvailableRide]);

  /**
   * Accepter la course actuellement affichée
   */
  const acceptCurrentRide = useCallback(async (): Promise<AcceptRideResult> => {
    if (!availableRide) {
      return { success: false, error: "Aucune course à accepter" };
    }

    const result = await driverRideService.acceptRide(availableRide.id);

    if (result.success) {
      const acceptedRide = {
        ...availableRide,
        status: "scheduled" as const,
        driverArrivedAt: null,
      };
      setActiveRide(acceptedRide);
      setAvailableRide(null);

      if (
        typeof window !== "undefined" &&
        window.confirm("Course acceptée. Ouvrir la navigation vers le point de prise en charge ?")
      ) {
        void openExternalNavigation({
          lat: availableRide.pickupLat,
          lng: availableRide.pickupLng,
          address: availableRide.pickupLocation,
          label: "Prise en charge",
        });
      }
    }

    return result;
  }, [availableRide, setActiveRide, setAvailableRide]);

  /**
   * Refuser la course actuelle (la cacher temporairement)
   */
  const declineCurrentRide = useCallback(
    (reason: "declined" | "timeout" = "declined") => {
      if (availableRide) {
        void driverRideService.respondOffer(availableRide.id, reason);
      }
      setAvailableRide(null);
    },
    [availableRide, setAvailableRide],
  );
  return {
    availableRide,
    acceptCurrentRide,
    declineCurrentRide,
    isOnline,
  };
}
