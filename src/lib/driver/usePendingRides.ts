"use client";

import { useEffect, useCallback } from "react";
import { driverRideService, PendingRide, AcceptRideResult } from "./rideService";
import { useDriverStore } from "./store";

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

    // Récupérer les courses existantes d'abord
    driverRideService.fetchPendingRides().then((rides) => {
      if (rides.length > 0 && !availableRide) {
        // Prendre la plus récente
        setAvailableRide(rides[0]);
      }
    });

    // S'abonner aux nouvelles courses
    driverRideService.subscribeToPendingRides(
      // Nouvelle course
      (ride) => {
        console.log("[usePendingRides] New ride received:", ride.id);
        setAvailableRide(ride);
      },
      // Course mise à jour
      (ride) => {
        console.log("[usePendingRides] Ride updated:", ride.id);
        if (availableRide?.id === ride.id) {
          setAvailableRide(ride);
        }
      },
      // Course supprimée/acceptée
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
      // Déplacer de availableRide à activeRide
      setActiveRide(availableRide);
      setAvailableRide(null);
    }

    return result;
  }, [availableRide, setActiveRide, setAvailableRide]);

  /**
   * Refuser la course actuelle (la cacher temporairement)
   */
  const declineCurrentRide = useCallback(() => {
    setAvailableRide(null);
  }, [setAvailableRide]);

  return {
    availableRide,
    acceptCurrentRide,
    declineCurrentRide,
    isOnline,
  };
}
