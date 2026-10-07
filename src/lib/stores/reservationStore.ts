import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Location, ReservationStore } from "@/lib/types/reservation.types";
import type { VehicleType } from "@/lib/vehicle";
import type { BookingPaymentMethod } from "@/lib/reservation/paymentChoice";

function parseCoordinate(value: unknown): number | null {
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseFloat(value);
  return null;
}

function normalizeLocation(location: unknown): Location | null {
  try {
    if (location === null || location === undefined) {
      return null;
    }

    if (typeof location !== "object") {
      throw new TypeError("Format de données incorrect");
    }

    const raw = location as Record<string, unknown>;
    const lat = parseCoordinate(raw.lat);
    const lon = parseCoordinate(raw.lon);

    if (lat === null || lon === null || Number.isNaN(lat) || Number.isNaN(lon)) {
      throw new TypeError("Coordonnées invalides");
    }

    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      throw new RangeError("Coordonnées hors limites");
    }

    return {
      lat,
      lon,
      display_name: typeof raw.display_name === "string" ? raw.display_name : "",
      address: typeof raw.address === "object" && raw.address !== null ? (raw.address as Record<string, unknown>) : {},
    };
  } catch (error) {
    console.error("[Store] Erreur de normalisation:", error);
    return null;
  }
}

const initialState = {
  departure: null,
  destination: null,
  pickupDateTime: new Date(),
  distance: null,
  duration: null,
  selectedVehicle: "STANDARD" as VehicleType,
  selectedOptions: [],
  paymentMethod: "cash" as BookingPaymentMethod,
  step: 1,
};

export const useReservationStore = create<ReservationStore>()(
  persist(
    (set) => ({
      ...initialState,

      setDeparture: (location) => {
        const normalized = normalizeLocation(location);
        set(() => ({ departure: normalized }));
      },

      setDestination: (location) => {
        const normalized = normalizeLocation(location);
        set(() => ({ destination: normalized }));
      },

      setPickupDateTime: (date) => {
        try {
          const validDate = new Date(date);
          if (Number.isNaN(validDate.getTime())) {
            throw new TypeError("Date invalide");
          }
          set(() => ({ pickupDateTime: validDate }));
        } catch (error) {
          console.error("[Store] Erreur lors de la définition de la date:", error);
          const fallbackDate = new Date();
          fallbackDate.setHours(fallbackDate.getHours() + 3);
          set(() => ({ pickupDateTime: fallbackDate }));
        }
      },

      setDistance: (distance) =>
        set(() => ({
          distance,
        })),

      setDuration: (duration) =>
        set(() => ({
          duration,
        })),

      setSelectedVehicle: (vehicle) =>
        set(() => ({
          selectedVehicle: vehicle as VehicleType,
        })),

      toggleOption: (option) =>
        set((state) => ({
          selectedOptions: state.selectedOptions.includes(option)
            ? state.selectedOptions.filter((o) => o !== option)
            : [...state.selectedOptions, option],
        })),

      setSelectedOptions: (options) =>
        set(() => ({
          selectedOptions: options,
        })),

      setPaymentMethod: (method) =>
        set(() => ({
          paymentMethod: method,
        })),

      setStep: (step) =>
        set(() => ({
          step,
        })),

      reset: () =>
        set(() => ({
          ...initialState,
          pickupDateTime: new Date(),
        })),

      addMinutesToPickupTime: (minutes) =>
        set((state) => {
          const newDate = new Date(state.pickupDateTime);
          newDate.setMinutes(newDate.getMinutes() + minutes);
          return { pickupDateTime: newDate };
        }),

      updatePickupDate: (date) =>
        set((state) => {
          try {
            const currentDate = new Date(state.pickupDateTime);
            const newDate = new Date(date);

            newDate.setHours(currentDate.getHours());
            newDate.setMinutes(currentDate.getMinutes());

            if (Number.isNaN(newDate.getTime())) {
              throw new TypeError("Date invalide après mise à jour");
            }

            return { pickupDateTime: newDate };
          } catch (error) {
            console.error("[Store] Erreur lors de la mise à jour de la date:", error);
            return state;
          }
        }),
    }),
    {
      name: "reservation-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        ...state,
        pickupDateTime: state.pickupDateTime.toISOString(),
      }),
      onRehydrateStorage: () => (state) => {
        if (state && typeof state.pickupDateTime === "string") {
          try {
            state.pickupDateTime = new Date(state.pickupDateTime);
          } catch (error) {
            console.error("[Store] Erreur lors de la réhydratation de la date:", error);
            state.pickupDateTime = new Date();
          }
        }
        if (state && state.paymentMethod !== "cash" && state.paymentMethod !== "card") {
          state.paymentMethod = "cash";
        }
      },
    },
  ),
);
