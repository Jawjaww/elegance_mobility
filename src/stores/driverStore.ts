/**
 * Driver Store - Zustand
 * Gestion de l'état du chauffeur (online/offline, course active, etc.)
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface Ride {
  id: string;
  pickup_address: string;
  dropoff_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dropoff_lat: number;
  dropoff_lng: number;
  price: number;
  distance_km: number;
  estimated_duration_min: number;
  status: "pending" | "accepted" | "picked_up" | "completed" | "cancelled";
  passenger_name?: string;
  passenger_rating?: number;
  created_at: string;
}

interface DriverStats {
  todayEarnings: number;
  todayRides: number;
  onlineTimeMinutes: number;
  rating: number;
}

interface DriverState {
  // État online/offline
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;

  // Course en cours/active
  activeRide: Ride | null;
  setActiveRide: (ride: Ride | null) => void;

  // Course disponible (entrante)
  availableRide: Ride | null;
  setAvailableRide: (ride: Ride | null) => void;
  clearAvailableRide: () => void;

  // Statistiques
  stats: DriverStats;
  updateStats: (stats: Partial<DriverStats>) => void;

  // Location
  currentLocation: {
    lat: number;
    lng: number;
    heading?: number | null;
    accuracy?: number | null;
  } | null;
  setCurrentLocation: (location: {
    lat: number;
    lng: number;
    heading?: number | null;
    accuracy?: number | null;
  }) => void;
}

export const useDriverStore = create<DriverState>()(
  persist(
    (set) => ({
      isOnline: false,
      setIsOnline: (online) => set({ isOnline: online }),

      activeRide: null,
      setActiveRide: (ride) => set({ activeRide: ride }),

      availableRide: null,
      setAvailableRide: (ride) => set({ availableRide: ride }),
      clearAvailableRide: () => set({ availableRide: null }),

      stats: {
        todayEarnings: 0,
        todayRides: 0,
        onlineTimeMinutes: 0,
        rating: 0,
      },
      updateStats: (newStats) =>
        set((state) => ({
          stats: { ...state.stats, ...newStats },
        })),

      currentLocation: null,
      setCurrentLocation: (location) => set({ currentLocation: location }),
    }),
    {
      name: "driver-storage",
      partialize: (state) => ({
        stats: state.stats,
        activeRide: state.activeRide,
      }),
    },
  ),
);
