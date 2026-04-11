"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/lib/database/client";
import { useDriverStore } from "./store";
import { driverRideService } from "./rideService";

/**
 * Hook centralisé pour gérer toutes les subscriptions du driver
 * Évite les conflits avec les autres stores
 */
export function useDriverSubscription() {
  const { isOnline, setAvailableRide, setActiveRide } = useDriverStore();
  const isSubscribed = useRef(false);

  useEffect(() => {
    // Nettoyage complet quand le composant se démonte
    return () => {
      driverRideService.unsubscribe();
      isSubscribed.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      console.log("[DriverSubscription] Driver hors ligne, désabonnement");
      driverRideService.unsubscribe();
      isSubscribed.current = false;
      return;
    }

    // Éviter les subscriptions multiples
    if (isSubscribed.current) {
      console.log("[DriverSubscription] Déjà abonné, ignoré");
      return;
    }

    console.log("[DriverSubscription] Démarrage subscription...");
    isSubscribed.current = true;

    // 1. Charger les courses existantes
    driverRideService.fetchPendingRides().then((rides) => {
      console.log(`[DriverSubscription] ${rides.length} courses en attente trouvées`);
      if (rides.length > 0) {
        setAvailableRide(rides[0]);
      }
    });

    // 2. S'abonner aux nouvelles courses
    driverRideService.subscribeToPendingRides(
      (ride) => {
        console.log("[DriverSubscription] 🆕 Nouvelle course reçue:", ride.id);
        setAvailableRide(ride);
      },
      (ride) => {
        console.log("[DriverSubscription] 📝 Course mise à jour:", ride.id);
        setAvailableRide(ride);
      },
      (rideId) => {
        console.log("[DriverSubscription] 🗑️ Course supprimée:", rideId);
        setAvailableRide(null);
      }
    );

    // 3. Écouter les changements sur la course active (si acceptée)
    const activeRideChannel = supabase
      .channel('driver-active-ride')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'rides',
          filter: `status=neq.pending`,
        },
        (payload) => {
          const { availableRide, activeRide } = useDriverStore.getState();
          
          // Si c'était la course disponible qui a été prise par quelqu'un d'autre
          if (availableRide?.id === payload.new.id && payload.new.status !== 'pending') {
            console.log("[DriverSubscription] Course disponible prise par un autre");
            setAvailableRide(null);
          }
          
          // Mettre à jour la course active si nécessaire
          if (activeRide?.id === payload.new.id) {
            console.log("[DriverSubscription] Course active mise à jour");
            // Mettre à jour avec les nouvelles données
          }
        }
      )
      .subscribe();

    return () => {
      console.log("[DriverSubscription] Cleanup");
      activeRideChannel.unsubscribe();
      // Note: on ne désabonne pas driverRideService ici pour garder la subscription active
    };
  }, [isOnline, setAvailableRide, setActiveRide]);

  return { isSubscribed: isSubscribed.current };
}
